import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboardSource = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);
const messagesSource = await readFile(
  new URL("../src/lib/i18n/messages.ts", import.meta.url),
  "utf8",
);

assert.match(dashboardSource, /const totalCompletedAttempts = history\.length/);
assert.match(
  dashboardSource,
  /totalCompletedAttempts === 0 && !isLoading && !isSyncError/,
);
console.log("PASS empty dashboard uses total completed attempts and excludes loading/error");

assert.match(dashboardSource, /isLoading \? \(/);
assert.match(dashboardSource, /DashboardStatusPanel/);
assert.match(dashboardSource, /isSyncError && !history\.length/);
console.log("PASS loading and error states are handled before onboarding");

assert.match(dashboardSource, /shouldShowOnboarding \? \(/);
assert.match(dashboardSource, /<NewUserOnboarding writingDraftHref=\{writingDraftHref\} t=\{t\} \/>/);
console.log("PASS zero-attempt users see a dedicated onboarding panel");

assert.match(dashboardSource, /href: "\/practice\/reading"/);
assert.match(dashboardSource, /href: "\/practice\/listening"/);
assert.match(dashboardSource, /href: "\/practice\/writing"/);
assert.match(dashboardSource, /md:grid-cols-3/);
assert.match(dashboardSource, /className="w-full"/);
console.log("PASS Reading, Listening, and Writing onboarding actions are present and responsive");

assert.match(dashboardSource, /writingDraftStoragePrefix/);
assert.match(dashboardSource, /findWritingDraftHref/);
assert.match(dashboardSource, /dashboard\.onboarding\.continueDraft/);
console.log("PASS saved Writing drafts keep a continue entry in the empty state");

assert.match(dashboardSource, /<>\s*<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">/);
assert.match(dashboardSource, /dashboard\.learningTrend/);
assert.match(dashboardSource, /dashboard\.skillRadar/);
assert.match(dashboardSource, /dashboard\.recentPractice/);
console.log("PASS populated dashboard sections remain behind the populated-state branch");

for (const key of [
  "dashboard.loadingTitle",
  "dashboard.loadingDescription",
  "dashboard.errorTitle",
  "dashboard.errorDescription",
  "dashboard.onboarding.title",
  "dashboard.onboarding.description",
  "dashboard.onboarding.draftTitle",
  "dashboard.onboarding.draftDescription",
  "dashboard.onboarding.benefitProgress",
  "dashboard.onboarding.benefitCompare",
  "dashboard.onboarding.benefitNextSteps",
  "dashboard.onboarding.readingDescription",
  "dashboard.onboarding.listeningDescription",
  "dashboard.onboarding.writingDescription",
  "dashboard.onboarding.startReading",
  "dashboard.onboarding.startListening",
  "dashboard.onboarding.startWriting",
  "dashboard.onboarding.continueDraft",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
console.log("PASS dashboard empty-state i18n keys exist in English and Chinese");

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
