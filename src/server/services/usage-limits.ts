import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      plan: "free" | "pro_monthly" | "pro_yearly";
      remaining: number | null;
    }
  | {
      allowed: false;
      status: 401 | 402 | 429;
      message: string;
      plan: "free" | "pro_monthly" | "pro_yearly";
      limit: number;
      used: number;
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
    .select("plan,status")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan = parsePlan(subscription?.plan);
  const isPro =
    (plan === "pro_monthly" || plan === "pro_yearly") &&
    ["active", "trialing"].includes(String(subscription?.status ?? ""));
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

function parsePlan(plan: unknown): "free" | "pro_monthly" | "pro_yearly" {
  if (plan === "pro_monthly" || plan === "pro_yearly") {
    return plan;
  }

  return "free";
}
