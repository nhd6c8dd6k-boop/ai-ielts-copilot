import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export type AdminDashboardData = {
  content: AdminContentItem[];
  users: string[][];
  prompts: string[][];
  promptTemplates: Array<{
    id: string;
    name: string;
    version: number;
    skill: "reading" | "listening" | "writing" | "speaking";
  }>;
  logs: string[];
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
      .select("id,task_type,topic,source_type,status,created_at")
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
        title: `Task ${item.task_type}: ${item.topic}`,
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
  };

  return labels[plan] ?? plan;
}
