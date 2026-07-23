import assert from "node:assert/strict";

import {
  FREE_LISTENING_SET_LIMIT,
  FREE_READING_SET_LIMIT,
  FREE_SPEAKING_DAILY_QUESTION_LIMIT,
  FREE_WRITING_DAILY_LIMIT,
  PRO_WRITING_DAILY_LIMIT,
  getPracticeSetLimitDecision,
  getSpeakingDailyLimitDecision,
  getUsageDayRange,
  getWritingDailyLimitDecision,
} from "../src/server/services/usage-limit-rules.ts";
import { isProSubscriptionRule } from "../src/server/services/membership-rules.ts";

function completed(ids) {
  return new Set(ids);
}

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: false,
    completedSetIds: completed([]),
    setId: "reading-a",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  true,
  "Free Reading user with 0 completed can start a new set",
);

const repeatedSetDecision = getPracticeSetLimitDecision({
  isAdmin: false,
  isPro: false,
  completedSetIds: completed(["reading-a"]),
  setId: "reading-a",
  limit: FREE_READING_SET_LIMIT,
});
assert.equal(repeatedSetDecision.used, 1);
assert.equal(repeatedSetDecision.allowed, true);
assert.equal(repeatedSetDecision.isRepeat, true);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: false,
    completedSetIds: completed(["a", "b", "c", "d", "e"]),
    setId: "f",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  false,
  "Free Reading user is blocked from a 6th new set",
);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: false,
    completedSetIds: completed(["a", "b", "c", "d", "e"]),
    setId: "c",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  true,
  "Free Reading user can repeat a completed set after reaching the limit",
);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: false,
    completedSetIds: completed(["l1", "l2", "l3", "l4", "l5"]),
    setId: "l6",
    limit: FREE_LISTENING_SET_LIMIT,
  }).allowed,
  false,
  "Free Listening user is blocked from a 6th new set",
);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: true,
    isPro: false,
    completedSetIds: completed(["a", "b", "c", "d", "e"]),
    setId: "f",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  true,
  "Admin is exempt from practice limits",
);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: true,
    completedSetIds: completed(["a", "b", "c", "d", "e"]),
    setId: "f",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  true,
  "Active Pro is exempt from Reading/Listening set limits",
);

assert.equal(
  getWritingDailyLimitDecision({
    isAdmin: false,
    isPro: false,
    usedToday: 0,
  }).allowed,
  true,
  "Free Writing 0/1 is allowed",
);

assert.equal(
  getWritingDailyLimitDecision({
    isAdmin: false,
    isPro: false,
    usedToday: FREE_WRITING_DAILY_LIMIT,
  }).allowed,
  false,
  "Free Writing 1/1 is blocked",
);

assert.equal(
  getWritingDailyLimitDecision({
    isAdmin: false,
    isPro: true,
    usedToday: PRO_WRITING_DAILY_LIMIT - 1,
  }).allowed,
  true,
  "Pro Writing 9/10 allows the 10th feedback",
);

assert.equal(
  getWritingDailyLimitDecision({
    isAdmin: false,
    isPro: true,
    usedToday: PRO_WRITING_DAILY_LIMIT,
  }).allowed,
  false,
  "Pro Writing 10/10 blocks the 11th feedback",
);

assert.equal(
  getWritingDailyLimitDecision({
    isAdmin: true,
    isPro: false,
    usedToday: 100,
  }).allowed,
  true,
  "Admin is exempt from Writing daily limits",
);

assert.equal(
  getSpeakingDailyLimitDecision({
    isAdmin: false,
    isPro: false,
    usedToday: FREE_SPEAKING_DAILY_QUESTION_LIMIT - 1,
    alreadyUnlocked: false,
  }).allowed,
  true,
  "Free Speaking user can unlock the 5th different question today",
);

assert.equal(
  getSpeakingDailyLimitDecision({
    isAdmin: false,
    isPro: false,
    usedToday: FREE_SPEAKING_DAILY_QUESTION_LIMIT,
    alreadyUnlocked: false,
  }).allowed,
  false,
  "Free Speaking user is blocked from unlocking a 6th different question today",
);

assert.equal(
  getSpeakingDailyLimitDecision({
    isAdmin: false,
    isPro: false,
    usedToday: FREE_SPEAKING_DAILY_QUESTION_LIMIT,
    alreadyUnlocked: true,
  }).allowed,
  true,
  "Reopening the same Speaking question does not consume another daily slot",
);

assert.equal(
  getSpeakingDailyLimitDecision({
    isAdmin: false,
    isPro: true,
    usedToday: 100,
    alreadyUnlocked: false,
  }).allowed,
  true,
  "Active Pro is exempt from Speaking daily question limits",
);

assert.equal(
  getSpeakingDailyLimitDecision({
    isAdmin: true,
    isPro: false,
    usedToday: 100,
    alreadyUnlocked: false,
  }).allowed,
  true,
  "Admin is exempt from Speaking daily question limits",
);

const now = new Date("2026-07-14T20:45:00.000Z");
const range = getUsageDayRange(now);
assert.equal(range.timezone, "UTC");
assert.equal(range.startOfDay.toISOString(), "2026-07-14T00:00:00.000Z");
assert.equal(range.endOfDay.toISOString(), "2026-07-15T00:00:00.000Z");

assert.equal(
  isProSubscriptionRule({
    plan: "pro",
    status: "active",
    expires_at: "2026-01-01T00:00:00.000Z",
  }),
  false,
  "Expired Pro is treated as Free by the membership rule",
);

assert.equal(
  isProSubscriptionRule({
    plan: "free",
    status: "cancelled",
    expires_at: "2027-01-01T00:00:00.000Z",
  }),
  false,
  "Cancelled Pro is treated as Free by the membership rule",
);

assert.equal(
  isProSubscriptionRule({
    plan: "pro",
    status: "active",
    expires_at: "2027-01-01T00:00:00.000Z",
  }),
  true,
  "Regranted active Pro is treated as Pro",
);

assert.equal(
  getPracticeSetLimitDecision({
    isAdmin: false,
    isPro: false,
    completedSetIds: completed(["a", "b", "c", "d", "e", "f", "g"]),
    setId: "a",
    limit: FREE_READING_SET_LIMIT,
  }).allowed,
  true,
  "Historical users over the free limit can still repeat completed sets",
);

console.log("Usage limit rule checks passed.");
