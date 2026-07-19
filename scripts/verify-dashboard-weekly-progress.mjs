import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

process.env.TZ = "America/Vancouver";

const sourcePath = new URL("../src/features/dashboard/weekly-progress.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "dashboard-weekly-progress-"));
const compiledPath = join(tempDir, "weekly-progress.mjs");

await writeFile(compiledPath, compiled.outputText);

const {
  WEEKLY_GOALS,
  getLocalWeekRange,
  getWeeklyPracticeProgress,
  mapPracticeHistoryToWeeklyAttempts,
} = await import(`file://${compiledPath}`);

assert.deepEqual(WEEKLY_GOALS, {
  reading: 2,
  listening: 2,
  writing: 1,
  total: 5,
});
console.log("PASS weekly goals are fixed at Reading 2, Listening 2, Writing 1, Total 5");

const sundayNow = new Date(2026, 6, 19, 23, 59, 59);
const { weekStart, weekEnd } = getLocalWeekRange(sundayNow);

assert.equal(weekStart.getDay(), 1);
assert.equal(weekStart.getHours(), 0);
assert.equal(weekStart.getMinutes(), 0);
assert.equal(weekEnd.getTime(), new Date(2026, 6, 20, 0, 0, 0).getTime());
console.log("PASS local week range runs Monday 00:00 to next Monday 00:00");

const progress = getWeeklyPracticeProgress({
  now: sundayNow,
  attempts: [
    attempt("monday", "reading", new Date(2026, 6, 13, 0, 0, 0)),
    attempt("reading-2", "reading", new Date(2026, 6, 15, 11, 0, 0)),
    attempt("listening-1", "listening", new Date(2026, 6, 19, 23, 59, 0)),
    attempt("writing-1", "writing", new Date(2026, 6, 16, 9, 0, 0)),
    attempt("previous-week", "reading", new Date(2026, 6, 12, 23, 59, 0)),
    attempt("next-week", "listening", new Date(2026, 6, 20, 0, 0, 0)),
    attempt("unknown", "speaking", new Date(2026, 6, 15, 12, 0, 0)),
    { id: "invalid-date", skill: "writing", completedAt: "not-a-date" },
    { id: "no-date", skill: "writing", completedAt: null },
  ],
});

assert.equal(progress.reading.completed, 2);
assert.equal(progress.listening.completed, 1);
assert.equal(progress.writing.completed, 1);
assert.equal(progress.total.completed, 4);
assert.equal(progress.isGoalComplete, false);
console.log("PASS weekly counts ignore old, next-week, unknown-skill, and invalid records");

const futureProgress = getWeeklyPracticeProgress({
  now: new Date(2026, 6, 15, 12, 0, 0),
  attempts: [
    attempt("past", "reading", new Date(2026, 6, 15, 10, 0, 0)),
    attempt("future", "reading", new Date(2026, 6, 15, 13, 0, 0)),
  ],
});

assert.equal(futureProgress.reading.completed, 1);
assert.equal(futureProgress.total.completed, 1);
console.log("PASS future timestamps inside the current week are not counted");

const dedupedProgress = getWeeklyPracticeProgress({
  now: sundayNow,
  attempts: [
    attempt("same-id", "reading", new Date(2026, 6, 15, 10, 0, 0)),
    attempt("same-id", "reading", new Date(2026, 6, 15, 10, 0, 0)),
  ],
});

assert.equal(dedupedProgress.reading.completed, 1);
assert.equal(dedupedProgress.total.completed, 1);
console.log("PASS duplicate attempt ids are counted once");

const overGoalProgress = getWeeklyPracticeProgress({
  now: sundayNow,
  attempts: [
    attempt("r1", "reading", new Date(2026, 6, 13, 10, 0, 0)),
    attempt("r2", "reading", new Date(2026, 6, 14, 10, 0, 0)),
    attempt("r3", "reading", new Date(2026, 6, 15, 10, 0, 0)),
    attempt("l1", "listening", new Date(2026, 6, 16, 10, 0, 0)),
    attempt("l2", "listening", new Date(2026, 6, 17, 10, 0, 0)),
    attempt("w1", "writing", new Date(2026, 6, 18, 10, 0, 0)),
    attempt("w2", "writing", new Date(2026, 6, 19, 10, 0, 0)),
  ],
});

assert.equal(overGoalProgress.total.completed, 7);
assert.equal(overGoalProgress.total.goal, 5);
assert.equal(overGoalProgress.total.percent, 100);
assert.equal(overGoalProgress.reading.percent, 100);
assert.equal(overGoalProgress.isGoalComplete, true);
console.log("PASS over-goal progress keeps real counts while capping progress bars");

const nullProgress = getWeeklyPracticeProgress({
  now: sundayNow,
  attempts: null,
});

assert.equal(nullProgress.total.completed, 0);
assert.equal(nullProgress.reading.completed, 0);
console.log("PASS null attempt data is safe");

const mappedAttempts = mapPracticeHistoryToWeeklyAttempts([
  {
    id: "history-writing",
    skill: "writing",
    title: "Writing task",
    scoreLabel: "Band 6.5",
    bandEstimate: 6.5,
    createdAt: new Date(2026, 6, 16, 10, 0, 0).toISOString(),
    detail: "Submitted",
  },
]);

assert.deepEqual(mappedAttempts, [
  {
    id: "history-writing",
    skill: "writing",
    completedAt: new Date(2026, 6, 16, 10, 0, 0).toISOString(),
  },
]);
console.log("PASS practice history maps to a standard completed-at structure");

const dstRange = getLocalWeekRange(new Date(2026, 2, 9, 12, 0, 0));

assert.equal(dstRange.weekStart.getDay(), 1);
assert.equal(dstRange.weekEnd.getDay(), 1);
assert.ok(dstRange.weekEnd.getTime() > dstRange.weekStart.getTime());
console.log("PASS local week calculation remains stable across DST weeks");

const dashboardSource = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);
const messagesSource = await readFile(
  new URL("../src/lib/i18n/messages.ts", import.meta.url),
  "utf8",
);

assert.match(dashboardSource, /dashboardNow && totalCompletedAttempts > 0 && !isLoading && !isSyncError/);
assert.match(dashboardSource, /<DashboardWeeklyProgressCard progress=\{weeklyProgress\} t=\{t\} \/>/);
assert.match(dashboardSource, /<DashboardNextActionCard action=\{nextAction\} t=\{t\} \/>/);
assert.match(dashboardSource, /mapPracticeHistoryToWeeklyAttempts\(history\)/);
assert.match(dashboardSource, /role="progressbar"/);
assert.match(dashboardSource, /aria-valuenow=\{ariaValue\}/);
assert.match(dashboardSource, /lg:grid-cols-\[0\.85fr_1\.15fr\]/);
assert.doesNotMatch(
  dashboardSource.match(/getWeeklyPracticeProgress\(\{[\s\S]*?\}\)/)?.[0] ?? "",
  /writingDraft/,
);
console.log("PASS dashboard renders Weekly Progress only in the populated, loaded state");

for (const key of [
  "dashboard.weeklyProgress.eyebrow",
  "dashboard.weeklyProgress.title",
  "dashboard.weeklyProgress.summary",
  "dashboard.weeklyProgress.description.inProgress",
  "dashboard.weeklyProgress.description.completed",
  "dashboard.weeklyProgress.reading",
  "dashboard.weeklyProgress.listening",
  "dashboard.weeklyProgress.writing",
  "dashboard.weeklyProgress.completed",
  "dashboard.weeklyProgress.viewPractice",
  "dashboard.weeklyProgress.aria.skillProgress",
  "dashboard.weeklyProgress.aria.totalProgress",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
console.log("PASS Weekly Progress i18n keys exist in English and Chinese");

function attempt(id, skill, completedAt) {
  return {
    id,
    skill,
    completedAt: completedAt.toISOString(),
  };
}

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
