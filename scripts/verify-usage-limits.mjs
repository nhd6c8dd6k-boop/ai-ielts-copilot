import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FREE_LISTENING_SET_LIMIT,
  FREE_READING_SET_LIMIT,
  FREE_SPEAKING_DAILY_QUESTION_LIMIT,
  FREE_WRITING_FEEDBACK_LIFETIME_LIMIT,
  PRO_WRITING_DAILY_LIMIT,
  getFreeWritingLifetimeLimitDecision,
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
  getFreeWritingLifetimeLimitDecision({
    isAdmin: false,
    isPro: false,
    used: 0,
  }).allowed,
  true,
  "Free Writing 0/3 is allowed",
);

assert.equal(
  getFreeWritingLifetimeLimitDecision({
    isAdmin: false,
    isPro: false,
    used: 1,
  }).remaining,
  2,
  "Free Writing 1/3 leaves 2 submissions",
);

assert.equal(
  getFreeWritingLifetimeLimitDecision({
    isAdmin: false,
    isPro: false,
    used: FREE_WRITING_FEEDBACK_LIFETIME_LIMIT - 1,
  }).allowed,
  true,
  "Free Writing 2/3 allows the final feedback submission",
);

assert.equal(
  getFreeWritingLifetimeLimitDecision({
    isAdmin: false,
    isPro: false,
    used: FREE_WRITING_FEEDBACK_LIFETIME_LIMIT,
  }).allowed,
  false,
  "Free Writing 3/3 is blocked",
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
  "Admin is exempt from Writing limits",
);

assert.equal(
  getFreeWritingLifetimeLimitDecision({
    isAdmin: false,
    isPro: true,
    used: 100,
  }).allowed,
  true,
  "Pro is exempt from Free Writing lifetime limits",
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

const cwd = process.cwd();
const quotaMigration = readFileSync(
  join(cwd, "supabase/migrations/016_add_free_writing_feedback_quota.sql"),
  "utf8",
);
const usageLimitsSource = readFileSync(
  join(cwd, "src/server/services/usage-limits.ts"),
  "utf8",
);
const submitRouteSource = readFileSync(
  join(cwd, "src/app/api/practice/writing/submit/route.ts"),
  "utf8",
);

assert.match(
  quotaMigration,
  /create table if not exists public\.writing_feedback_quota_usage/,
  "Free Writing quota migration creates a dedicated ledger table",
);
assert.match(
  quotaMigration,
  /attempt_id uuid references public\.writing_attempts\(id\) on delete set null/,
  "Quota ledger links consumed usage to successful Writing attempts",
);
assert.match(
  quotaMigration,
  /where attempt_id is not null/,
  "Quota ledger enforces one consumed quota row per Writing attempt",
);
assert.match(
  quotaMigration,
  /pg_advisory_xact_lock/,
  "Quota reservation RPC uses a database lock for concurrent submissions",
);
assert.match(
  quotaMigration,
  /reserve_free_writing_feedback_quota/,
  "Migration includes a reservation RPC",
);
assert.match(
  quotaMigration,
  /consume_free_writing_feedback_quota/,
  "Migration includes a consumption RPC",
);
assert.match(
  quotaMigration,
  /release_free_writing_feedback_quota/,
  "Migration includes a release RPC for failed submissions",
);
assert.match(
  quotaMigration,
  /status in \('reserved', 'consumed', 'released'\)/,
  "Quota rows can be reserved, consumed, or released",
);
assert.match(
  usageLimitsSource,
  /\.from\("writing_feedback_quota_usage"\)/,
  "Free Writing usage is counted from the new quota ledger",
);
assert.match(
  usageLimitsSource,
  /\.eq\("status", "consumed"\)/,
  "Only successfully consumed Writing feedback rows count against Free usage",
);
assert.match(
  usageLimitsSource,
  /FREE_WRITING_FEEDBACK_LIMIT_REACHED/,
  "Free Writing limit responses use a stable error code",
);
assert.match(
  submitRouteSource,
  /reserveFreeWritingFeedbackQuota/,
  "Writing submit reserves Free quota before AI grading",
);
assert.match(
  submitRouteSource,
  /consumeFreeWritingFeedbackQuota/,
  "Writing submit consumes Free quota after a saved feedback attempt",
);
assert.match(
  submitRouteSource,
  /releaseFreeWritingFeedbackQuota/,
  "Writing submit releases Free quota when grading or saving fails",
);
assert.match(
  submitRouteSource,
  /quotaReservation && !feedbackSaved/,
  "Writing submit does not release quota after feedback has already been saved",
);

console.log("Usage limit rule checks passed.");
