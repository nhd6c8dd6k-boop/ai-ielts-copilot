import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const sourcePath = new URL("../src/features/dashboard/skill-focus.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "dashboard-skill-focus-"));
const compiledPath = join(tempDir, "skill-focus.mjs");

await writeFile(compiledPath, compiled.outputText);

const { getSkillFocusInsights } = await import(`file://${compiledPath}`);

const emptyInsights = getSkillFocusInsights([]);

assert.equal(emptyInsights.length, 3);
assert.equal(getInsight(emptyInsights, "reading").status, "not_practised");
assert.equal(getInsight(emptyInsights, "listening").status, "not_practised");
assert.equal(getInsight(emptyInsights, "writing").status, "not_practised");
assert.equal(getInsight(emptyInsights, "reading").href, "/practice/reading");
assert.equal(getInsight(emptyInsights, "listening").href, "/practice/listening");
assert.equal(getInsight(emptyInsights, "writing").href, "/practice/writing");
console.log("PASS no-record insights show not practised yet with practice links");

assert.equal(
  getInsight(getSkillFocusInsights([attempt("reading", 5.5)]), "reading").status,
  "needs_practice",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("reading", 6.2)]), "reading").status,
  "building_consistency",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("reading", 6.8)]), "reading").status,
  "good_progress",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("reading", 7.6)]), "reading").status,
  "strong_performance",
);
console.log("PASS Reading band categories are actionable and non-punitive");

assert.equal(
  getInsight(getSkillFocusInsights([attempt("listening", 5.5)]), "listening")
    .status,
  "needs_practice",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("listening", 6.1)]), "listening")
    .status,
  "building_consistency",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("listening", 6.9)]), "listening")
    .status,
  "good_progress",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("listening", 7.5)]), "listening")
    .status,
  "strong_performance",
);
console.log("PASS Listening band categories are actionable and non-punitive");

assert.equal(
  getInsight(getSkillFocusInsights([attempt("writing", 5.5)]), "writing").status,
  "needs_practice",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("writing", 6.5)]), "writing").status,
  "building_consistency",
);
assert.equal(
  getInsight(getSkillFocusInsights([attempt("writing", 7)]), "writing").status,
  "strong_performance",
);
console.log("PASS Writing categories follow the requested band thresholds");

const averageInsights = getSkillFocusInsights([
  attempt("reading", 5.5),
  attempt("reading", 7),
]);

assert.equal(getInsight(averageInsights, "reading").status, "building_consistency");
console.log("PASS multiple attempts use an average rather than only the latest item");

const accuracyFallbackInsights = getSkillFocusInsights([
  attempt("listening", Number.NaN, 88),
]);

assert.equal(
  getInsight(accuracyFallbackInsights, "listening").status,
  "strong_performance",
);
console.log("PASS invalid band can safely fall back to accuracy when available");

const nullBandInsights = getSkillFocusInsights([
  attempt("writing", Number.NaN),
]);

assert.equal(
  getInsight(nullBandInsights, "writing").status,
  "building_consistency",
);
console.log("PASS null or NaN scores do not crash and avoid false low-score labels");

const mixedInsights = getSkillFocusInsights([
  attempt("reading", 6.5),
  attempt("writing", 5.5),
]);

assert.equal(getInsight(mixedInsights, "reading").status, "good_progress");
assert.equal(getInsight(mixedInsights, "writing").status, "needs_practice");
assert.equal(getInsight(mixedInsights, "listening").status, "not_practised");
console.log("PASS mixed histories produce three independent skill insights");

const dashboardSource = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);
const messagesSource = await readFile(
  new URL("../src/lib/i18n/messages.ts", import.meta.url),
  "utf8",
);

assert.match(dashboardSource, /const skillRows = getSkillFocusInsights\(history\)/);
assert.match(dashboardSource, /dashboard\.skillFocus/);
assert.match(dashboardSource, /t\(row\.statusKey, row\.statusFallback\)/);
assert.match(dashboardSource, /t\(row\.descriptionKey, row\.descriptionFallback\)/);
assert.match(dashboardSource, /<Link href=\{row\.href\}>/);
assert.match(dashboardSource, /variant="outline" size="sm" className="mt-4"/);
assert.match(dashboardSource, /shouldShowOnboarding \? \(/);
assert.match(dashboardSource, /isLoading \? \(/);
assert.match(dashboardSource, /isSyncError && !history\.length/);
console.log("PASS Dashboard Skill Focus renders in the populated-state branch");

for (const key of [
  "dashboard.skillFocus.status.not_practised",
  "dashboard.skillFocus.status.needs_practice",
  "dashboard.skillFocus.status.building_consistency",
  "dashboard.skillFocus.status.good_progress",
  "dashboard.skillFocus.status.strong_performance",
  "dashboard.skillFocus.reading.title",
  "dashboard.skillFocus.listening.title",
  "dashboard.skillFocus.writing.title",
  "dashboard.skillFocus.reading.button",
  "dashboard.skillFocus.listening.button",
  "dashboard.skillFocus.writing.button",
  "dashboard.skillFocus.reading.description.not_practised",
  "dashboard.skillFocus.reading.description.needs_practice",
  "dashboard.skillFocus.reading.description.building_consistency",
  "dashboard.skillFocus.reading.description.good_progress",
  "dashboard.skillFocus.reading.description.strong_performance",
  "dashboard.skillFocus.listening.description.not_practised",
  "dashboard.skillFocus.listening.description.needs_practice",
  "dashboard.skillFocus.listening.description.building_consistency",
  "dashboard.skillFocus.listening.description.good_progress",
  "dashboard.skillFocus.listening.description.strong_performance",
  "dashboard.skillFocus.writing.description.not_practised",
  "dashboard.skillFocus.writing.description.needs_practice",
  "dashboard.skillFocus.writing.description.building_consistency",
  "dashboard.skillFocus.writing.description.good_progress",
  "dashboard.skillFocus.writing.description.strong_performance",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
console.log("PASS Skill Focus i18n keys exist in English and Chinese");

function attempt(skill, bandEstimate, accuracy) {
  return {
    id: `${skill}-${bandEstimate}-${accuracy ?? "none"}`,
    skill,
    title: `${skill} practice`,
    scoreLabel: Number.isFinite(bandEstimate) ? `Band ${bandEstimate}` : "Submitted",
    bandEstimate,
    accuracy,
    createdAt: "2026-07-19T10:00:00.000Z",
    detail: "Test attempt",
  };
}

function getInsight(insights, skill) {
  const insight = insights.find((item) => item.skill === skill);

  assert.ok(insight, `${skill} insight should exist`);

  return insight;
}

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
