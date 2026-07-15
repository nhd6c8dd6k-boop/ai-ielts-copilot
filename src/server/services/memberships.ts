import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isExpiredAt,
  isProSubscriptionRule,
  resolveExtendedExpiry,
} from "@/server/services/membership-rules";

export type MembershipPlan = "free" | "pro" | "pro_monthly" | "pro_yearly";

export type MembershipStatus =
  | "trialing"
  | "active"
  | "manual"
  | "expired"
  | "cancelled"
  | "canceled"
  | "past_due"
  | "incomplete";

export type MembershipSubscription = {
  plan?: string | null;
  status?: string | null;
  expires_at?: string | null;
  current_period_end?: string | null;
};

export type AdminMembershipItem = {
  userId: string;
  email: string;
  signedUpAt: string | null;
  lastLoginAt: string | null;
  plan: MembershipPlan;
  status: MembershipStatus;
  startedAt: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  grantedBy: string | null;
  notes: string | null;
  isPro: boolean;
  isExpired: boolean;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type MembershipErrorCategory =
  | "membership_write_failed"
  | "invalid_membership_value"
  | "membership_schema_mismatch"
  | "membership_log_failed";

export class MembershipServiceError extends Error {
  category: MembershipErrorCategory;
  cause: unknown;

  constructor(category: MembershipErrorCategory, message: string, cause: unknown) {
    super(message);
    this.name = "MembershipServiceError";
    this.category = category;
    this.cause = cause;
  }
}

export async function getMemberships(
  admin: SupabaseAdminClient = createSupabaseAdminClient(),
  search = "",
  limit = 100,
): Promise<AdminMembershipItem[]> {
  const [usersResult, subscriptionsResult] = await Promise.all([
    admin
      .from("users")
      .select("id,email,created_at,last_login_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("subscriptions")
      .select(
        "user_id,plan,status,started_at,expires_at,current_period_end,updated_at,granted_by,notes",
      ),
  ]);

  const subscriptionByUserId = new Map(
    (subscriptionsResult.data ?? []).map((subscription) => [
      subscription.user_id,
      subscription,
    ]),
  );
  const normalizedSearch = search.trim().toLowerCase();

  return (usersResult.data ?? [])
    .filter((user) =>
      normalizedSearch
        ? String(user.email ?? "").toLowerCase().includes(normalizedSearch)
        : true,
    )
    .map((user) => {
      const subscription = subscriptionByUserId.get(user.id);
      const expiresAt =
        subscription?.expires_at ?? subscription?.current_period_end ?? null;

      return {
        userId: user.id,
        email: user.email,
        signedUpAt: user.created_at ?? null,
        lastLoginAt: user.last_login_at ?? null,
        plan: parseMembershipPlan(subscription?.plan),
        status: parseMembershipStatus(subscription?.status),
        startedAt: subscription?.started_at ?? null,
        expiresAt,
        updatedAt: subscription?.updated_at ?? null,
        grantedBy: subscription?.granted_by ?? null,
        notes: subscription?.notes ?? null,
        isPro: isProSubscription(subscription),
        isExpired: isExpiredAt(expiresAt),
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt ?? a.signedUpAt ?? "");
      const bTime = Date.parse(b.updatedAt ?? b.signedUpAt ?? "");

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    })
    .slice(0, limit);
}

export async function grantManualPro({
  admin,
  adminUserId,
  targetUserId,
  expiresAt,
  notes,
}: {
  admin: SupabaseAdminClient;
  adminUserId: string;
  targetUserId: string;
  expiresAt: string;
  notes?: string | null;
}) {
  const now = new Date().toISOString();
  const { data: existingSubscription, error: loadError } = await admin
    .from("subscriptions")
    .select("plan,status,expires_at,current_period_end,started_at")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (loadError) {
    throwMembershipError("grant_load", loadError);
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: targetUserId,
      plan: "pro",
      status: "active",
      started_at: existingSubscription?.started_at ?? now,
      expires_at: expiresAt,
      current_period_end: expiresAt,
      cancel_at_period_end: false,
      granted_by: adminUserId,
      notes: normalizeNotes(notes),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throwMembershipError("grant", error);
  }

  await logMembershipAction(admin, {
    adminUserId,
    action: "manual_pro_granted",
    targetUserId,
    expiresAt,
    durationDays: calculateDurationDays(now, expiresAt),
    notes,
    previousPlan: existingSubscription?.plan ?? null,
    previousStatus: existingSubscription?.status ?? null,
  });
}

export async function extendManualPro({
  admin,
  adminUserId,
  targetUserId,
  durationDays,
  notes,
}: {
  admin: SupabaseAdminClient;
  adminUserId: string;
  targetUserId: string;
  durationDays: number;
  notes?: string | null;
}) {
  const { data: subscription, error: loadError } = await admin
    .from("subscriptions")
    .select("plan,status,expires_at,current_period_end,started_at")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (loadError) {
    throwMembershipError("extend_load", loadError);
  }

  const now = new Date();
  const expiresAt = resolveExtendedExpiry({
    now,
    currentExpiry:
      subscription?.expires_at ?? subscription?.current_period_end ?? null,
    durationDays,
  });
  const updatedAt = now.toISOString();

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: targetUserId,
      plan: "pro",
      status: "active",
      started_at: subscription?.started_at ?? updatedAt,
      expires_at: expiresAt,
      current_period_end: expiresAt,
      cancel_at_period_end: false,
      granted_by: adminUserId,
      notes: normalizeNotes(notes),
      updated_at: updatedAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throwMembershipError("extend", error);
  }

  await logMembershipAction(admin, {
    adminUserId,
    action: "manual_pro_extended",
    targetUserId,
    expiresAt,
    durationDays,
    notes,
    previousPlan: subscription?.plan ?? null,
    previousStatus: subscription?.status ?? null,
  });
}

export async function revokeManualPro({
  admin,
  adminUserId,
  targetUserId,
  notes,
}: {
  admin: SupabaseAdminClient;
  adminUserId: string;
  targetUserId: string;
  notes?: string | null;
}) {
  const now = new Date().toISOString();
  const { data: existingSubscription, error: loadError } = await admin
    .from("subscriptions")
    .select("plan,status,expires_at,current_period_end")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (loadError) {
    throwMembershipError("revoke_load", loadError);
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: targetUserId,
      plan: "free",
      status: "cancelled",
      expires_at: now,
      current_period_end: now,
      cancel_at_period_end: true,
      granted_by: adminUserId,
      notes: normalizeNotes(notes),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throwMembershipError("revoke", error);
  }

  await logMembershipAction(admin, {
    adminUserId,
    action: "manual_pro_revoked",
    targetUserId,
    expiresAt: existingSubscription?.expires_at ?? now,
    notes,
    previousPlan: existingSubscription?.plan ?? null,
    previousStatus: existingSubscription?.status ?? null,
  });
}

export function isProSubscription(
  subscription: MembershipSubscription | null | undefined,
) {
  return isProSubscriptionRule(subscription);
}

export function parseMembershipPlan(plan: unknown): MembershipPlan {
  if (plan === "pro" || plan === "pro_monthly" || plan === "pro_yearly") {
    return plan;
  }

  return "free";
}

export function parseMembershipStatus(status: unknown): MembershipStatus {
  if (
    status === "trialing" ||
    status === "active" ||
    status === "manual" ||
    status === "expired" ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "past_due" ||
    status === "incomplete"
  ) {
    return status;
  }

  return "incomplete";
}

function normalizeNotes(notes?: string | null) {
  const normalized = notes?.trim();
  return normalized ? normalized : null;
}

function calculateDurationDays(startIso: string, endIso: string) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function throwMembershipError(operation: string, error: unknown): never {
  throw new MembershipServiceError(
    classifyMembershipError(error),
    `Membership ${operation} failed.`,
    error,
  );
}

export function classifyMembershipError(error: unknown): MembershipErrorCategory {
  const message = getSupabaseErrorField(error, "message").toLowerCase();
  const details = getSupabaseErrorField(error, "details").toLowerCase();
  const hint = getSupabaseErrorField(error, "hint").toLowerCase();
  const combined = `${message} ${details} ${hint}`;

  if (
    combined.includes("invalid input value for enum") ||
    combined.includes("violates check constraint")
  ) {
    return "invalid_membership_value";
  }

  if (
    combined.includes("could not find") ||
    combined.includes("schema cache") ||
    combined.includes("column") ||
    combined.includes("constraint")
  ) {
    return "membership_schema_mismatch";
  }

  return "membership_write_failed";
}

export function getSupabaseErrorField(error: unknown, field: string) {
  if (error instanceof MembershipServiceError) {
    return getSupabaseErrorField(error.cause, field);
  }

  if (typeof error !== "object" || error === null || !(field in error)) {
    return "";
  }

  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

async function logMembershipAction(
  admin: SupabaseAdminClient,
  {
    adminUserId,
    action,
    targetUserId,
    expiresAt,
    durationDays,
    notes,
    previousPlan,
    previousStatus,
  }: {
    adminUserId: string;
    action:
      | "manual_pro_granted"
      | "manual_pro_extended"
      | "manual_pro_revoked";
    targetUserId: string;
    expiresAt: string;
    durationDays?: number | null;
    notes?: string | null;
    previousPlan?: string | null;
    previousStatus?: string | null;
  },
) {
  const { error } = await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: "subscription",
    target_id: targetUserId,
    metadata: {
      target_user_id: targetUserId,
      plan: action === "manual_pro_revoked" ? "free" : "pro",
      expiry: expiresAt,
      duration_days: durationDays ?? null,
      note: normalizeNotes(notes),
      previous_plan: previousPlan ?? null,
      previous_status: previousStatus ?? null,
    },
  });

  if (error) {
    throw new MembershipServiceError(
      "membership_log_failed",
      "Membership log insert failed.",
      error,
    );
  }
}
