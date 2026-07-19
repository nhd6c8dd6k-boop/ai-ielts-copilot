import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const sourcePath = new URL("../src/features/dashboard/next-action.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "dashboard-next-action-"));
const compiledPath = join(tempDir, "next-action.mjs");

await writeFile(compiledPath, compiled.outputText);

const { getDashboardNextAction } = await import(`file://${compiledPath}`);

function attempt(skill, bandEstimate, createdAt = "2026-07-01T00:00:00.000Z") {
  return {
    id: `${skill}-${createdAt}-${bandEstimate}`,
    skill,
    title: `${skill} practice`,
    scoreLabel: `Band ${bandEstimate}`,
    bandEstimate,
    createdAt,
    detail: "Test attempt",
  };
}

assert.equal(getDashboardNextAction({ history: [] }), null);
assert.equal(
  getDashboardNextAction({
    history: [attempt("reading", 6)],
    isLoading: true,
  }),
  null,
);
assert.equal(
  getDashboardNextAction({
    history: [attempt("reading", 6)],
    isError: true,
  }),
  null,
);
console.log("PASS next action is hidden for empty, loading, and error states");

const draftAction = getDashboardNextAction({
  history: [attempt("reading", 6)],
  writingDraft: {
    href: "/practice/writing/task-1",
    wordCount: 126,
  },
});

assert.equal(draftAction?.kind, "continue_draft");
assert.equal(draftAction?.skill, "writing");
assert.equal(draftAction?.href, "/practice/writing/task-1");
assert.equal(draftAction?.metadata?.wordCount, 126);
console.log("PASS Writing draft takes priority over recommendations");

assert.equal(
  getDashboardNextAction({ history: [attempt("reading", 6)] })?.skill,
  "listening",
);
assert.equal(
  getDashboardNextAction({
    history: [attempt("reading", 6), attempt("listening", 6)],
  })?.skill,
  "writing",
);
assert.equal(
  getDashboardNextAction({ history: [attempt("writing", 6)] })?.skill,
  "reading",
);
assert.equal(
  getDashboardNextAction({
    history: [attempt("reading", 6), attempt("writing", 6)],
  })?.skill,
  "listening",
);
console.log("PASS missing-skill recommendations follow the baseline priority");

const lowerAverageAction = getDashboardNextAction({
  history: [
    attempt("reading", 7, "2026-07-10T00:00:00.000Z"),
    attempt("reading", 7, "2026-07-11T00:00:00.000Z"),
    attempt("listening", 5.5, "2026-07-12T00:00:00.000Z"),
    attempt("listening", 6, "2026-07-13T00:00:00.000Z"),
    attempt("writing", 7, "2026-07-14T00:00:00.000Z"),
    attempt("writing", 7, "2026-07-15T00:00:00.000Z"),
  ],
});

assert.equal(lowerAverageAction?.skill, "listening");
assert.equal(
  lowerAverageAction?.reasonKey,
  "dashboard.nextAction.reason.lowerRecentAverage",
);
console.log("PASS all-three-skill users can receive a lower-average recommendation");

const leastRecentAction = getDashboardNextAction({
  history: [
    attempt("reading", 6.5, "2026-07-15T00:00:00.000Z"),
    attempt("listening", 6.5, "2026-07-10T00:00:00.000Z"),
    attempt("writing", 6.5, "2026-07-18T00:00:00.000Z"),
  ],
});

assert.equal(leastRecentAction?.skill, "listening");
assert.equal(
  leastRecentAction?.reasonKey,
  "dashboard.nextAction.reason.leastRecentlyPracticed",
);
console.log("PASS limited samples fall back to least-recently practised skill");

const invalidBandAction = getDashboardNextAction({
  history: [
    attempt("reading", 0, "2026-07-16T00:00:00.000Z"),
    attempt("reading", 0, "2026-07-17T00:00:00.000Z"),
    attempt("listening", 6.5, "2026-07-18T00:00:00.000Z"),
    attempt("listening", 6.5, "2026-07-19T00:00:00.000Z"),
    attempt("writing", 6.5, "2026-07-10T00:00:00.000Z"),
    attempt("writing", 6.5, "2026-07-11T00:00:00.000Z"),
  ],
});

assert.notEqual(invalidBandAction?.reasonKey, "dashboard.nextAction.reason.lowerRecentAverage");
assert.equal(invalidBandAction?.skill, "writing");
console.log("PASS missing or zero band values are not treated as weak scores");

const dashboardSource = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);
const messagesSource = await readFile(
  new URL("../src/lib/i18n/messages.ts", import.meta.url),
  "utf8",
);

assert.match(dashboardSource, /totalCompletedAttempts === 0 && !isLoading && !isSyncError/);
assert.match(dashboardSource, /<DashboardNextActionCard action=\{nextAction\} t=\{t\} \/>/);
assert.match(dashboardSource, /wordCount: countWords\(draft\)/);
console.log("PASS dashboard renders one next-action card only in the populated branch");

for (const key of [
  "dashboard.nextAction.continueEyebrow",
  "dashboard.nextAction.recommendedEyebrow",
  "dashboard.nextAction.continueWritingTitle",
  "dashboard.nextAction.continueWritingDescription",
  "dashboard.nextAction.continueWritingButton",
  "dashboard.nextAction.reason.continueDraft",
  "dashboard.nextAction.reason.notPracticed",
  "dashboard.nextAction.reason.lowerRecentAverage",
  "dashboard.nextAction.reason.leastRecentlyPracticed",
  "dashboard.nextAction.reason.buildConsistency",
  "dashboard.nextAction.button.reading",
  "dashboard.nextAction.button.listening",
  "dashboard.nextAction.button.writing",
  "dashboard.nextAction.notPracticedTitle.reading",
  "dashboard.nextAction.notPracticedTitle.listening",
  "dashboard.nextAction.notPracticedTitle.writing",
  "dashboard.nextAction.weakSkillDescription.writing",
  "dashboard.nextAction.leastRecentDescription.listening",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
console.log("PASS next-action i18n keys exist in English and Chinese");

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
