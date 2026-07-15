import assert from "node:assert/strict";

import {
  getEffectiveMembershipStatus,
  isProSubscriptionRule,
  resolveExtendedExpiry,
} from "../src/server/services/membership-rules.ts";

const now = new Date("2026-07-14T12:00:00.000Z");

function isoPlusDays(base, days) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

const grantWithoutSubscription = {
  plan: "pro",
  status: "active",
  started_at: now.toISOString(),
  expires_at: isoPlusDays(now, 30),
};
assert.equal(isProSubscriptionRule(grantWithoutSubscription), true);

const existingFreeGrant = {
  plan: "pro",
  status: "active",
  expires_at: isoPlusDays(now, 30),
};
assert.equal(isProSubscriptionRule(existingFreeGrant), true);
assert.equal(getEffectiveMembershipStatus(existingFreeGrant, now), "active");

const activeProExpiry = new Date("2026-08-14T12:00:00.000Z");
assert.equal(
  resolveExtendedExpiry({
    now,
    currentExpiry: activeProExpiry.toISOString(),
    durationDays: 30,
  }),
  isoPlusDays(activeProExpiry, 30),
);

const expiredProExpiry = new Date("2026-06-14T12:00:00.000Z");
assert.equal(
  resolveExtendedExpiry({
    now,
    currentExpiry: expiredProExpiry.toISOString(),
    durationDays: 30,
  }),
  isoPlusDays(now, 30),
);

assert.equal(
  isProSubscriptionRule({
    plan: "free",
    status: "cancelled",
    expires_at: now.toISOString(),
  }),
  false,
);
assert.equal(
  getEffectiveMembershipStatus(
    {
      plan: "free",
      status: "cancelled",
      expires_at: expiredProExpiry.toISOString(),
    },
    now,
  ),
  "cancelled",
);

assert.equal(
  isProSubscriptionRule({
    plan: "pro",
    status: "manual",
    expires_at: isoPlusDays(now, 30),
  }),
  false,
);

assert.equal(
  isProSubscriptionRule({
    plan: "pro",
    status: "active",
    expires_at: expiredProExpiry.toISOString(),
  }),
  false,
);
assert.equal(
  getEffectiveMembershipStatus(
    {
      plan: "pro",
      status: "active",
      expires_at: expiredProExpiry.toISOString(),
    },
    now,
  ),
  "expired",
);

const activeProRevoked = {
  plan: "free",
  status: "cancelled",
  expires_at: activeProExpiry.toISOString(),
};
assert.equal(isProSubscriptionRule(activeProRevoked), false);
assert.equal(getEffectiveMembershipStatus(activeProRevoked, now), "cancelled");

const grantAfterRevoke = {
  ...activeProRevoked,
  plan: "pro",
  status: "active",
  expires_at: isoPlusDays(now, 30),
};
assert.equal(isProSubscriptionRule(grantAfterRevoke), true);
assert.equal(getEffectiveMembershipStatus(grantAfterRevoke, now), "active");

console.log("Membership rule checks passed.");
