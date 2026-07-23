import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isProSubscription,
  parseMembershipPlan,
  type MembershipPlan,
} from "@/server/services/memberships";
import {
  FREE_LISTENING_SET_LIMIT,
  FREE_READING_SET_LIMIT,
  FREE_WRITING_DAILY_LIMIT,
  PRO_WRITING_DAILY_LIMIT,
  getPracticeSetLimitDecision,
  getUsageDayRange,
  getWritingDailyLimitDecision,
  type UsageResource,
} from "@/server/services/usage-limit-rules";

export type AiUsageFeature =
  | "reading_generate"
  | "listening_generate"
  | "writing_generate"
  | "writing_grade";

export type AiUsageSkill = "reading" | "listening" | "writing";

export type UsageLimitResult =
  | {
      allowed: true;
      mode: "demo" | "supabase";
      userId: string | null;
      plan: MembershipPlan;
      remaining: number | null;
    }
  | {
      allowed: false;
      status: 401 | 402 | 429;
      message: string;
      plan: MembershipPlan;
      limit: number;
      used: number;
    };

export type PracticeUsageBucket = {
  used: number;
  limit: number | null;
  unlimited: boolean;
};

export type WritingUsageBucket = {
  usedToday: number;
  limitToday: number | null;
  unlimited: boolean;
  resetsAt: string;
  timezone: "UTC";
};

export type UserPracticeUsage = {
  plan: MembershipPlan;
  isPro: boolean;
  isAdmin: boolean;
  reading: PracticeUsageBucket;
  listening: PracticeUsageBucket;
  writing: WritingUsageBucket;
};

export type PracticeSetUsageDecision = {
  allowed: boolean;
  resource: "reading" | "listening";
  plan: MembershipPlan;
  isAdmin: boolean;
  isPro: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
  isRepeat: boolean;
  remainingNewSets: number | null;
  upgradeUrl: "/pricing";
};

export type WritingFeedbackUsageDecision = {
  allowed: boolean;
  resource: "writing";
  plan: MembershipPlan;
  isAdmin: boolean;
  isPro: boolean;
  usedToday: number;
  limitToday: number | null;
  unlimited: boolean;
  resetsAt: string;
  timezone: "UTC";
  upgradeUrl: "/pricing";
};

const freeDailyLimits: Record<AiUsageFeature, number> = {
  // V1 disables user-side question generation for content quality and cost
  // control. Keep these feature keys for historical logs and possible Pro+
  // experiments; active user AI usage should go through writing_grade.
  reading_generate: 3,
  listening_generate: 2,
  writing_generate: 3,
  writing_grade: 2,
};

const proDailyLimit = 100;
const writingUsageLocks = new Map<string, Promise<void>>();

const skillByFeature: Record<AiUsageFeature, AiUsageSkill> = {
  reading_generate: "reading",
  listening_generate: "listening",
  writing_generate: "writing",
  writing_grade: "writing",
};

export async function checkAiUsageLimit(
  feature: AiUsageFeature,
): Promise<UsageLimitResult> {
  if (!isSupabaseConfigured()) {
    return {
      allowed: true,
      mode: "demo",
      userId: null,
      plan: "free",
      remaining: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      status: 401,
      message: "请先登录，再使用真实 AI 生成。",
      plan: "free",
      limit: freeDailyLimits[feature],
      used: 0,
    };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status,expires_at,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan = parseMembershipPlan(subscription?.plan);
  const isPro = isProSubscription(subscription);
  const limit = isPro ? proDailyLimit : freeDailyLimits[feature];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("ai_generation_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", feature)
    .gte("created_at", today.toISOString());

  if (error) {
    return {
      allowed: false,
      status: 429,
      message: "暂时无法检查 AI 使用额度，请稍后重试。",
      plan,
      limit,
      used: 0,
    };
  }

  const used = count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      status: isPro ? 429 : 402,
      message: isPro
        ? "今日 AI 使用次数较多，请明天继续。"
        : "今日免费 AI 次数已用完，升级 Pro 后可继续生成。",
      plan,
      limit,
      used,
    };
  }

  return {
    allowed: true,
    mode: "supabase",
    userId: user.id,
    plan,
    remaining: limit - used - 1,
  };
}

export async function getUserPracticeUsage(
  userId: string,
): Promise<UserPracticeUsage> {
  const admin = createSupabaseAdminClient();
  const dayRange = getUsageDayRange();

  const [
    profileResult,
    subscriptionResult,
    readingSetIds,
    listeningSetIds,
    writingUsageResult,
  ] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin
      .from("subscriptions")
      .select("plan,status,expires_at,current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    getDistinctCompletedPracticeSetIds({
      userId,
      skill: "reading",
    }),
    getDistinctCompletedPracticeSetIds({
      userId,
      skill: "listening",
    }),
    admin
      .from("writing_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dayRange.startOfDay.toISOString())
      .lt("created_at", dayRange.endOfDay.toISOString()),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (subscriptionResult.error) {
    throw new Error(subscriptionResult.error.message);
  }

  if (writingUsageResult.error) {
    throw new Error(writingUsageResult.error.message);
  }

  const subscription = subscriptionResult.data;
  const isAdmin = profileResult.data?.role === "admin";
  const isPro = isProSubscription(subscription);
  const plan = parseMembershipPlan(subscription?.plan);
  const unlimitedPractice = isAdmin || isPro;

  return {
    plan,
    isPro,
    isAdmin,
    reading: {
      used: readingSetIds.size,
      limit: unlimitedPractice ? null : FREE_READING_SET_LIMIT,
      unlimited: unlimitedPractice,
    },
    listening: {
      used: listeningSetIds.size,
      limit: unlimitedPractice ? null : FREE_LISTENING_SET_LIMIT,
      unlimited: unlimitedPractice,
    },
    writing: {
      usedToday: writingUsageResult.count ?? 0,
      limitToday: isAdmin
        ? null
        : isPro
          ? PRO_WRITING_DAILY_LIMIT
          : FREE_WRITING_DAILY_LIMIT,
      unlimited: isAdmin,
      resetsAt: dayRange.endOfDay.toISOString(),
      timezone: dayRange.timezone,
    },
  };
}

export async function canStartReadingSet(userId: string, setId: string) {
  return canUsePracticeSet({ userId, setId, resource: "reading" });
}

export async function canSubmitReadingSet(userId: string, setId: string) {
  return canUsePracticeSet({ userId, setId, resource: "reading" });
}

export async function canStartListeningSet(userId: string, setId: string) {
  return canUsePracticeSet({ userId, setId, resource: "listening" });
}

export async function canSubmitListeningSet(userId: string, setId: string) {
  return canUsePracticeSet({ userId, setId, resource: "listening" });
}

export async function canSubmitWritingFeedback(
  userId: string,
): Promise<WritingFeedbackUsageDecision> {
  const usage = await getUserPracticeUsage(userId);
  const decision = getWritingDailyLimitDecision({
    isAdmin: usage.isAdmin,
    isPro: usage.isPro,
    usedToday: usage.writing.usedToday,
  });

  return {
    allowed: decision.allowed,
    resource: "writing",
    plan: usage.plan,
    isAdmin: usage.isAdmin,
    isPro: usage.isPro,
    usedToday: decision.usedToday,
    limitToday: decision.limitToday,
    unlimited: decision.unlimited,
    resetsAt: usage.writing.resetsAt,
    timezone: usage.writing.timezone,
    upgradeUrl: "/pricing",
  };
}

export async function runWithWritingUsageGate<T>(
  userId: string,
  action: () => Promise<T>,
) {
  let release!: () => void;
  const currentLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previousLock = writingUsageLocks.get(userId) ?? Promise.resolve();
  const chainedLock = previousLock.catch(() => undefined).then(() => currentLock);

  writingUsageLocks.set(userId, chainedLock);
  await previousLock.catch(() => undefined);

  try {
    return await action();
  } finally {
    release();

    if (writingUsageLocks.get(userId) === chainedLock) {
      writingUsageLocks.delete(userId);
    }
  }
}

export function buildUsageLimitResponse(
  decision: PracticeSetUsageDecision | WritingFeedbackUsageDecision,
) {
  if (decision.resource === "writing") {
    return {
      error: "usage_limit_reached",
      message: buildUsageLimitMessage(decision.resource, decision.isPro),
      resource: decision.resource,
      limit: decision.limitToday,
      used: decision.usedToday,
      canRetryExisting: false,
      upgradeUrl: decision.upgradeUrl,
      resetsAt: decision.resetsAt,
      timezone: decision.timezone,
    };
  }

  return {
    error: "usage_limit_reached",
    message: buildUsageLimitMessage(decision.resource, decision.isPro),
    resource: decision.resource,
    limit: decision.limit,
    used: decision.used,
    canRetryExisting: true,
    upgradeUrl: decision.upgradeUrl,
  };
}

export async function recordAiUsage({
  feature,
  userId,
  model,
  status,
  errorMessage,
}: {
  feature: AiUsageFeature;
  userId: string | null;
  model: string;
  status: "success" | "fallback" | "error";
  errorMessage?: string;
}) {
  if (!userId || !isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  await supabase.from("ai_generation_logs").insert({
    user_id: userId,
    skill: skillByFeature[feature],
    feature,
    model,
    status,
    error_message: errorMessage ?? null,
  });
}

async function canUsePracticeSet({
  userId,
  setId,
  resource,
}: {
  userId: string;
  setId: string;
  resource: "reading" | "listening";
}): Promise<PracticeSetUsageDecision> {
  const [usage, completedSetIds] = await Promise.all([
    getUserPracticeUsage(userId),
    getDistinctCompletedPracticeSetIds({ userId, skill: resource }),
  ]);
  const decision = getPracticeSetLimitDecision({
    isAdmin: usage.isAdmin,
    isPro: usage.isPro,
    completedSetIds,
    setId,
    limit:
      resource === "reading"
        ? FREE_READING_SET_LIMIT
        : FREE_LISTENING_SET_LIMIT,
  });

  return {
    allowed: decision.allowed,
    resource,
    plan: usage.plan,
    isAdmin: usage.isAdmin,
    isPro: usage.isPro,
    used: decision.used,
    limit: decision.limit,
    unlimited: decision.unlimited,
    isRepeat: decision.isRepeat,
    remainingNewSets: decision.remainingNewSets,
    upgradeUrl: "/pricing",
  };
}

async function getDistinctCompletedPracticeSetIds({
  userId,
  skill,
}: {
  userId: string;
  skill: "reading" | "listening";
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("practice_history")
    .select("set_id,content_id")
    .eq("user_id", userId)
    .eq("skill", skill);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((attempt) => attempt.set_id ?? attempt.content_id)
      .filter((value): value is string => Boolean(value)),
  );
}

function buildUsageLimitMessage(
  resource: UsageResource,
  isPro: boolean,
) {
  if (resource === "reading") {
    return "You've completed your 5 free Reading practice sets. You can still repeat completed sets. Upgrade to Pro for unlimited access to new Reading sets.";
  }

  if (resource === "listening") {
    return "You've completed your 5 free Listening practice sets. You can still repeat completed sets. Upgrade to Pro for unlimited access to new Listening sets.";
  }

  return isPro
    ? "You've used today's 10 AI Writing feedbacks. Your allowance resets daily."
    : "You've used today's free AI Writing feedback. Upgrade to Pro for up to 10 AI Writing feedbacks per day.";
}
