export type MembershipLike = {
  plan?: string | null;
  status?: string | null;
  expires_at?: string | null;
  current_period_end?: string | null;
};

const proPlans = new Set(["pro", "pro_monthly", "pro_yearly"]);
const activeStatuses = new Set(["active", "trialing"]);

export function isProSubscriptionRule(
  subscription: MembershipLike | null | undefined,
) {
  const plan = String(subscription?.plan ?? "free");
  const status = String(subscription?.status ?? "incomplete");
  const expiresAt = subscription?.expires_at ?? subscription?.current_period_end;

  if (!proPlans.has(plan) || !activeStatuses.has(status)) {
    return false;
  }

  return !isExpiredAt(expiresAt ?? null);
}

export function resolveExtendedExpiry({
  now,
  currentExpiry,
  durationDays,
}: {
  now: Date;
  currentExpiry?: string | null;
  durationDays: number;
}) {
  const parsedExpiry = parseDate(currentExpiry ?? null);
  const base = parsedExpiry && parsedExpiry > now ? parsedExpiry : now;
  return addDays(base, durationDays).toISOString();
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isExpiredAt(value: string | null) {
  const date = parseDate(value);
  return Boolean(date && date.getTime() <= Date.now());
}
