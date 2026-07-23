import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWritingDisplayTitle } from "@/lib/writing-task-display";
import { normalizeWritingVisualData } from "@/lib/writing-visual-data";
import {
  getMemberships,
  type AdminMembershipItem,
} from "@/server/services/memberships";

export type { AdminMembershipItem } from "@/server/services/memberships";

export type AdminContentType = "reading" | "listening" | "writing";
export type AdminContentStatus = "draft" | "review" | "published" | "archived";

export type AdminContentItem = {
  id: string;
  type: AdminContentType;
  title: string;
  skill: "Reading" | "Listening" | "Writing";
  source: string;
  status: AdminContentStatus;
  audioStatus?: string | null;
  audioUrl?: string | null;
};

export type AdminUserActivityItem = {
  userId: string;
  email: string;
  signedUpAt: string | null;
  lastActivityAt: string | null;
  readingAttempts: number;
  listeningAttempts: number;
  writingAttempts: number;
  totalAttempts: number;
  latestAttemptType: "Reading" | "Listening" | "Writing" | null;
  latestAttemptScore: string | null;
};

export type AdminDashboardData = {
  content: AdminContentItem[];
  users: string[][];
  userActivity: AdminUserActivityItem[];
  memberships: AdminMembershipItem[];
  prompts: string[][];
  promptTemplates: Array<{
    id: string;
    name: string;
    version: number;
    skill: "reading" | "listening" | "writing" | "speaking";
  }>;
  logs: string[];
};

type AdminUserActivityAccumulator = {
  readingAttempts: number;
  listeningAttempts: number;
  writingAttempts: number;
  latestAttemptType: "Reading" | "Listening" | "Writing" | null;
  latestAttemptScore: string | null;
  latestAttemptAt: string | null;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const admin = createSupabaseAdminClient();
  const [
    readingSets,
    listeningSets,
    writingTasks,
    users,
    subscriptions,
    prompts,
    logs,
    userActivity,
    memberships,
  ] = await Promise.all([
    admin
      .from("reading_sets")
      .select("id,title,source_type,status,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("listening_sets")
      .select("id,title,source_type,status,audio_status,audio_url,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("writing_tasks")
      .select("id,title,task_type,topic,prompt,visual_data,source_type,status,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("users")
      .select("id,email,role,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("subscriptions").select("user_id,plan,status"),
    admin
      .from("prompt_templates")
      .select("id,name,version,skill,active")
      .order("name", { ascending: true })
      .order("version", { ascending: false })
      .limit(50),
    admin
      .from("admin_logs")
      .select("action,target_type,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    getUserActivity(admin),
    getMemberships(admin),
  ]);

  const subscriptionByUserId = new Map(
    (subscriptions.data ?? []).map((item) => [item.user_id, item]),
  );

  return {
    content: [
      ...(readingSets.data ?? []).map((item) => ({
        id: item.id,
        type: "reading" as const,
        title: item.title,
        skill: "Reading" as const,
        source: formatSource(item.source_type),
        status: item.status as AdminContentStatus,
      })),
      ...(listeningSets.data ?? []).map((item) => ({
        id: item.id,
        type: "listening" as const,
        title: item.title,
        skill: "Listening" as const,
        source: formatSource(item.source_type),
        status: item.status as AdminContentStatus,
        audioStatus: item.audio_status,
        audioUrl: item.audio_url,
      })),
      ...(writingTasks.data ?? []).map((item) => ({
        id: item.id,
        type: "writing" as const,
        title: getWritingDisplayTitle({
          taskType: item.task_type === 1 ? 1 : 2,
          topic: item.topic,
          prompt: item.prompt,
          title: item.title,
          visualTitle: normalizeWritingVisualData(item.visual_data)?.title,
        }),
        skill: "Writing" as const,
        source: formatSource(item.source_type),
        status: item.status as AdminContentStatus,
      })),
    ],
    users: (users.data ?? []).map((user) => {
      const subscription = subscriptionByUserId.get(user.id);

      return [
        user.email,
        formatPlan(subscription?.plan ?? "free"),
        `${user.role} · ${subscription?.status ?? user.status}`,
      ];
    }),
    userActivity,
    memberships,
    prompts: (prompts.data ?? []).map((prompt) => [
      prompt.name,
      `v${prompt.version}`,
      `${prompt.skill} · ${prompt.active ? "active" : "inactive"}`,
    ]),
    promptTemplates: (prompts.data ?? []).map((prompt) => ({
      id: prompt.id,
      name: prompt.name,
      version: prompt.version,
      skill: prompt.skill,
    })),
    logs: (logs.data ?? []).map(
      (log) =>
        `${log.action} · ${log.target_type} · ${new Date(
          log.created_at,
        ).toLocaleString()}`,
    ),
  };
}

export async function getUserActivity(
  admin = createSupabaseAdminClient(),
  limit = 100,
): Promise<AdminUserActivityItem[]> {
  const [usersResult, profilesResult, practiceResult, writingResult] =
    await Promise.all([
      admin
        .from("users")
        .select("id,email,role,status,created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("profiles").select("id,role,created_at").limit(500),
      admin
        .from("practice_history")
        .select(
          "user_id,skill,title,score_label,score,band_estimate,submitted_at,created_at",
        )
        .in("skill", ["reading", "listening"])
        .order("submitted_at", { ascending: false })
        .limit(5000),
      admin
        .from("writing_attempts")
        .select("user_id,overall_band,created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

  const profileByUserId = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );

  const activityByUserId = new Map<string, AdminUserActivityAccumulator>();

  const ensureActivity = (userId: string) => {
    const existing = activityByUserId.get(userId);

    if (existing) {
      return existing;
    }

    const activity: AdminUserActivityAccumulator = {
      readingAttempts: 0,
      listeningAttempts: 0,
      writingAttempts: 0,
      latestAttemptType: null,
      latestAttemptScore: null,
      latestAttemptAt: null,
    };
    activityByUserId.set(userId, activity);
    return activity;
  };

  for (const attempt of practiceResult.data ?? []) {
    const activity = ensureActivity(attempt.user_id);
    const skill = attempt.skill === "listening" ? "Listening" : "Reading";

    if (skill === "Reading") {
      activity.readingAttempts += 1;
    } else {
      activity.listeningAttempts += 1;
    }

    updateLatestAttempt(activity, {
      type: skill,
      score: formatPracticeAttemptScore(attempt),
      attemptedAt: attempt.submitted_at ?? attempt.created_at ?? null,
    });
  }

  for (const attempt of writingResult.data ?? []) {
    const activity = ensureActivity(attempt.user_id);
    activity.writingAttempts += 1;
    updateLatestAttempt(activity, {
      type: "Writing",
      score:
        attempt.overall_band == null
          ? null
          : `Band ${Number(attempt.overall_band).toFixed(1)}`,
      attemptedAt: attempt.created_at ?? null,
    });
  }

  return (usersResult.data ?? [])
    .map((user) => {
      const profile = profileByUserId.get(user.id);
      const activity = activityByUserId.get(user.id) ?? {
        readingAttempts: 0,
        listeningAttempts: 0,
        writingAttempts: 0,
        latestAttemptType: null,
        latestAttemptScore: null,
        latestAttemptAt: null,
      };
      const totalAttempts =
        activity.readingAttempts +
        activity.listeningAttempts +
        activity.writingAttempts;

      return {
        userId: user.id,
        email: user.email,
        signedUpAt: user.created_at ?? profile?.created_at ?? null,
        lastActivityAt: activity.latestAttemptAt,
        readingAttempts: activity.readingAttempts,
        listeningAttempts: activity.listeningAttempts,
        writingAttempts: activity.writingAttempts,
        totalAttempts,
        latestAttemptType: activity.latestAttemptType,
        latestAttemptScore: activity.latestAttemptScore,
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.lastActivityAt ?? a.signedUpAt ?? "");
      const bTime = Date.parse(b.lastActivityAt ?? b.signedUpAt ?? "");

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })
    .slice(0, limit);
}

function updateLatestAttempt(
  activity: {
    latestAttemptType: "Reading" | "Listening" | "Writing" | null;
    latestAttemptScore: string | null;
    latestAttemptAt: string | null;
  },
  attempt: {
    type: "Reading" | "Listening" | "Writing";
    score: string | null;
    attemptedAt: string | null;
  },
) {
  const currentTime = Date.parse(activity.latestAttemptAt ?? "");
  const nextTime = Date.parse(attempt.attemptedAt ?? "");

  if (
    attempt.attemptedAt &&
    (!activity.latestAttemptAt ||
      (Number.isFinite(nextTime) ? nextTime : 0) >
        (Number.isFinite(currentTime) ? currentTime : 0))
  ) {
    activity.latestAttemptType = attempt.type;
    activity.latestAttemptScore = attempt.score;
    activity.latestAttemptAt = attempt.attemptedAt;
  }
}

function formatPracticeAttemptScore(attempt: {
  score_label: string | null;
  score: number | null;
  band_estimate: number | null;
}) {
  if (attempt.band_estimate != null) {
    return `Band ${Number(attempt.band_estimate).toFixed(1)}`;
  }

  if (attempt.score_label) {
    return attempt.score_label;
  }

  if (attempt.score != null) {
    return `${Number(attempt.score).toFixed(0)}%`;
  }

  return null;
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    ai_generated: "AI Generated",
    admin_original: "Admin Original",
    user_private_upload: "User Upload",
    official_public_link: "Official Link",
  };

  return labels[source] ?? source;
}

function formatPlan(plan: string) {
  const labels: Record<string, string> = {
    free: "Free",
    pro_monthly: "Pro Monthly",
    pro_yearly: "Pro Yearly",
    pro: "Pro",
  };

  return labels[plan] ?? plan;
}
