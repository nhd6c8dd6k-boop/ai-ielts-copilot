import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const sourcePath = new URL("../src/features/profile/hero-summary.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "profile-hero-summary-"));
const compiledPath = join(tempDir, "hero-summary.mjs");

await writeFile(compiledPath, compiled.outputText);

const { getProfileHeroSummary, getTotalCompletedPractice } = await import(
  `file://${compiledPath}`
);

assert.equal(
  getProfileHeroSummary({
    profile: { displayName: "  Michael  " },
    fallbackName: "IELTS learner",
  }).displayName,
  "Michael",
);
assert.equal(
  getProfileHeroSummary({
    profile: { displayName: "" },
    authUser: { name: "Auth Name", email: "learner@example.com" },
    fallbackName: "IELTS learner",
  }).displayName,
  "Auth Name",
);
assert.equal(
  getProfileHeroSummary({
    profile: { displayName: "" },
    authUser: { name: "", email: "learner@example.com" },
    fallbackName: "IELTS learner",
  }).displayName,
  "learner",
);
assert.equal(
  getProfileHeroSummary({
    profile: { displayName: "" },
    authUser: { name: "", email: "" },
    fallbackName: "IELTS learner",
  }).displayName,
  "IELTS learner",
);
console.log("PASS display name fallback order is stable");

assert.equal(
  getProfileHeroSummary({
    subscription: { isPro: false },
    fallbackName: "IELTS learner",
  }).membershipStatus,
  "free",
);
assert.equal(
  getProfileHeroSummary({
    subscription: { isPro: true },
    fallbackName: "IELTS learner",
  }).membershipStatus,
  "pro",
);
assert.equal(
  getProfileHeroSummary({
    subscription: { isPro: true },
    isMembershipError: true,
    fallbackName: "IELTS learner",
  }).membershipStatus,
  "unknown",
);
assert.equal(
  getProfileHeroSummary({
    subscription: { isPro: false },
    isMembershipLoading: true,
    fallbackName: "IELTS learner",
  }).membershipStatus,
  "unknown",
);
console.log("PASS membership loading/error never misreports Free");

assert.equal(
  getProfileHeroSummary({
    profile: { createdAt: "2026-07-01T10:00:00.000Z" },
    authUser: { createdAt: "2026-06-01T10:00:00.000Z" },
    fallbackName: "IELTS learner",
  }).memberSince?.toISOString(),
  "2026-07-01T10:00:00.000Z",
);
assert.equal(
  getProfileHeroSummary({
    profile: { createdAt: "not-a-date" },
    authUser: { createdAt: "also-not-a-date" },
    fallbackName: "IELTS learner",
  }).memberSince,
  undefined,
);
console.log("PASS member since prefers profiles.created_at and hides invalid dates");

assert.equal(
  getTotalCompletedPractice([
    { id: "r1", skill: "reading" },
    { id: "l1", skill: "listening" },
    { id: "w1", skill: "writing" },
    { id: "w1", skill: "writing" },
    { id: "draft", skill: "draft" },
    { id: "unknown", skill: "speaking" },
    { id: null, skill: null },
  ]),
  3,
);
assert.equal(getTotalCompletedPractice(null), 0);
console.log("PASS total practice counts Reading, Listening, and Writing once");

assert.equal(
  getProfileHeroSummary({
    totalPracticeCount: 38,
    completedAttempts: [],
    fallbackName: "IELTS learner",
  }).totalPractice,
  38,
);
assert.equal(
  getProfileHeroSummary({
    totalPracticeCount: 38,
    isPracticeCountError: true,
    fallbackName: "IELTS learner",
  }).totalPractice,
  null,
);
assert.equal(
  getProfileHeroSummary({
    totalPracticeCount: 38,
    isPracticeCountLoading: true,
    fallbackName: "IELTS learner",
  }).totalPractice,
  null,
);
console.log("PASS practice count loading/error never misreports 0");

const profilePageSource = await readFile(
  new URL("../src/app/profile/page.tsx", import.meta.url),
  "utf8",
);
const profileApiSource = await readFile(
  new URL("../src/app/api/profile/route.ts", import.meta.url),
  "utf8",
);
const messagesSource = await readFile(
  new URL("../src/lib/i18n/messages.ts", import.meta.url),
  "utf8",
);

assert.match(profilePageSource, /<ProfileHeroSummaryCard/);
assert.match(profilePageSource, /<ProfileHeroStatusCard/);
assert.match(profilePageSource, /syncMode === "loading"/);
assert.match(profilePageSource, /syncMode === "error"/);
assert.match(profilePageSource, /ProfileHeroSummaryCard[\s\S]*<div className="grid gap-6 xl:grid-cols/);
assert.match(profilePageSource, /break-all text-sm text-slate-600/);
assert.match(profilePageSource, /md:grid-cols-\[1\.1fr_0\.9fr\]/);
assert.match(profilePageSource, /formatMemberSince/);
assert.match(profilePageSource, /summary\.totalPractice === null \? "-" : summary\.totalPractice/);
assert.match(profilePageSource, /Account information/);
assert.match(profilePageSource, /Save profile/);
console.log("PASS Profile hero appears before existing account controls");

assert.match(profileApiSource, /created_at/);
assert.match(profileApiSource, /authUser/);
assert.match(profileApiSource, /practice_total/);
assert.match(profileApiSource, /practice_total_error/);
assert.match(profileApiSource, /subscription_error/);
assert.match(profileApiSource, /\.from\("practice_history"\)/);
assert.match(profileApiSource, /\.in\("skill", \["reading", "listening", "writing"\]\)/);
console.log("PASS Profile API returns non-sensitive overview data");

for (const key of [
  "profile.hero.overview",
  "profile.hero.fallbackName",
  "profile.hero.freeMember",
  "profile.hero.proMember",
  "profile.hero.memberSince",
  "profile.hero.totalPractice",
  "profile.hero.loadingTitle",
  "profile.hero.loadingDescription",
  "profile.hero.errorTitle",
  "profile.hero.errorDescription",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
console.log("PASS Profile hero i18n keys exist in English and Chinese");

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
