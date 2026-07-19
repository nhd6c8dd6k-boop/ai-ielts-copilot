import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const sourcePath = new URL("../src/features/profile/best-scores.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "profile-best-scores-"));
const compiledPath = join(tempDir, "best-scores.mjs");

await writeFile(compiledPath, compiled.outputText);

const { getBestScores, isValidIeltsBand } = await import(
  `file://${compiledPath}`
);

assert.deepEqual(
  getBestScores([
    { id: "r1", skill: "reading", bandEstimate: 6 },
    { id: "r2", skill: "reading", bandEstimate: 7.5 },
    { id: "l1", skill: "listening", bandEstimate: 8 },
    { id: "w1", skill: "writing", overallBand: 6.5 },
  ]),
  { reading: 7.5, listening: 8, writing: 6.5, personalBest: 8 },
);
console.log("PASS highest bands are selected per skill and personal best");

assert.deepEqual(
  getBestScores([
    { id: "r1", skill: "reading", bandEstimate: 6.5 },
    { id: "r1", skill: "reading", bandEstimate: 8.5 },
    { id: "r2", skill: "reading", bandEstimate: 6.5 },
    { id: "l1", skill: "listening", bandEstimate: 6.5 },
    { id: "w1", skill: "writing", overallBand: 7 },
  ]),
  { reading: 6.5, listening: 6.5, writing: 7, personalBest: 7 },
);
console.log("PASS duplicate attempt ids are counted once");

assert.deepEqual(
  getBestScores([
    { id: "r-null", skill: "reading", bandEstimate: null },
    { id: "r-undefined", skill: "reading", bandEstimate: undefined },
    { id: "r-nan", skill: "reading", bandEstimate: Number.NaN },
    { id: "r-negative", skill: "reading", bandEstimate: -1 },
    { id: "r-high", skill: "reading", bandEstimate: 9.5 },
    { id: "r-string", skill: "reading", bandEstimate: "7.5" },
    { id: "r-decimal", skill: "reading", bandEstimate: 6.25 },
    { id: "unknown", skill: "speaking", bandEstimate: 9 },
    { id: "l-valid", skill: "listening", bandEstimate: 0.5 },
    { id: "w-valid", skill: "writing", overallBand: 0 },
  ]),
  { reading: null, listening: 0.5, writing: null, personalBest: 0.5 },
);
console.log("PASS invalid bands and unsupported skills are ignored");

assert.deepEqual(getBestScores([]), {
  reading: null,
  listening: null,
  writing: null,
  personalBest: null,
});
assert.deepEqual(getBestScores(null), {
  reading: null,
  listening: null,
  writing: null,
  personalBest: null,
});
console.log("PASS empty data returns null scores instead of zero");

for (const value of [0.5, 1, 6, 6.5, 9]) {
  assert.equal(isValidIeltsBand(value), true);
}
for (const value of [
  0,
  null,
  undefined,
  Number.NaN,
  -0,
  -0.5,
  9.0000001,
  9.5,
  "6.5",
  "",
  true,
  new Number(6.5),
  6.499999999,
  6.25,
]) {
  assert.equal(isValidIeltsBand(value), false);
}
console.log("PASS IELTS band validation accepts only positive numeric half bands");

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

assert.match(profilePageSource, /getBestScores\(bestScoreAttempts\)/);
assert.match(profilePageSource, /<BestScoresCard/);
assert.match(profilePageSource, /isLoading=\{syncMode === "loading"\}/);
assert.match(profilePageSource, /hasError=\{bestScoresError \|\| syncMode === "error"\}/);
assert.match(profilePageSource, /sm:grid-cols-2 lg:grid-cols-4/);
assert.match(profilePageSource, /formatBestBand/);
assert.match(profilePageSource, /profile\.bestScores\.personalBest/);
assert.doesNotMatch(profilePageSource, /profile\.bestScores\.overall/);
assert.doesNotMatch(profilePageSource, /Best Overall|Overall Band|IELTS Overall/);
assert.match(profilePageSource, /aria-label=\{/);
assert.match(profilePageSource, /profile\.bestScores\.noScoreYet/);
assert.match(profilePageSource, /aria-busy=\{isLoading\}/);
assert.ok(
  profilePageSource.indexOf("<ProfileHeroSummaryCard") <
    profilePageSource.indexOf("<BestScoresCard"),
  "Best Scores should appear after the hero summary",
);
assert.ok(
  profilePageSource.indexOf("<BestScoresCard") <
    profilePageSource.indexOf('<div className="grid gap-6 xl:grid-cols'),
  "Best Scores should appear before membership/account content",
);
console.log("PASS Profile page renders Best Scores in the requested position");

assert.match(profileApiSource, /\.from\("practice_history"\)/);
assert.match(profileApiSource, /\.select\("id,skill,band_estimate"\)/);
assert.match(profileApiSource, /\.eq\("user_id", user\.id\)/);
assert.match(profileApiSource, /\.in\("skill", \["reading", "listening", "writing"\]\)/);
assert.match(profileApiSource, /best_score_attempts/);
assert.match(profileApiSource, /best_scores_error/);
console.log("PASS Profile API reuses scoped practice history for Best Scores");

for (const key of [
  "profile.bestScores.title",
  "profile.bestScores.reading",
  "profile.bestScores.listening",
  "profile.bestScores.writing",
  "profile.bestScores.personalBest",
  "profile.bestScores.noScoreYet",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
assert.equal(countOccurrences(messagesSource, `"profile.bestScores.overall"`), 0);
assert.match(messagesSource, /"profile\.bestScores\.personalBest": "Personal Best"/);
assert.match(messagesSource, /"profile\.bestScores\.personalBest": "个人最高分"/);
console.log("PASS Best Scores i18n keys exist in English and Chinese");

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
