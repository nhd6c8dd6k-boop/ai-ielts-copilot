import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const sourcePath = new URL(
  "../src/features/profile/lifetime-statistics.ts",
  import.meta.url,
);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "profile-lifetime-statistics-"));
const compiledPath = join(tempDir, "lifetime-statistics.mjs");

await writeFile(compiledPath, compiled.outputText);

const { getLifetimeStatistics, formatLifetimeStatisticValue } = await import(
  `file://${compiledPath}`
);

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: 3,
    listeningCompleted: 2,
    writingCompleted: 4,
    wordsWritten: 1250,
  }),
  {
    readingCompleted: 3,
    listeningCompleted: 2,
    writingCompleted: 4,
    wordsWritten: 1250,
  },
);
console.log("PASS Lifetime Statistics preserves valid counts");

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: 0,
    listeningCompleted: 0,
    writingCompleted: 0,
    wordsWritten: 0,
  }),
  {
    readingCompleted: 0,
    listeningCompleted: 0,
    writingCompleted: 0,
    wordsWritten: 0,
  },
);
assert.deepEqual(getLifetimeStatistics({}), {
  readingCompleted: null,
  listeningCompleted: null,
  writingCompleted: null,
  wordsWritten: null,
});
assert.deepEqual(getLifetimeStatistics(null), {
  readingCompleted: null,
  listeningCompleted: null,
  writingCompleted: null,
  wordsWritten: null,
});
console.log("PASS successful zero data and unavailable data stay distinct");

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: 0,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: null,
  }),
  {
  readingCompleted: 0,
  listeningCompleted: null,
  writingCompleted: null,
  wordsWritten: null,
  },
);
console.log("PASS partial success preserves zero without masking errors");

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: null,
    listeningCompleted: Number.NaN,
    writingCompleted: -1,
    wordsWritten: undefined,
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: null,
  },
);
console.log("PASS invalid counts are kept unavailable instead of becoming zero");

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: 3.9,
    listeningCompleted: 2.1,
    writingCompleted: 1.5,
    wordsWritten: 12400.7,
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: 12400,
  },
);
console.log("PASS decimal counts are invalid while words are floored");

assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: 8,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: null,
  }),
  {
    readingCompleted: 8,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: null,
  },
);
assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: null,
    listeningCompleted: 5,
    writingCompleted: null,
    wordsWritten: null,
  }),
  {
    readingCompleted: null,
    listeningCompleted: 5,
    writingCompleted: null,
    wordsWritten: null,
  },
);
assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: 4,
    wordsWritten: null,
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: 4,
    wordsWritten: null,
  },
);
assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: "1500",
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: 1500,
  },
);
assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: "not-a-number",
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: null,
    wordsWritten: null,
  },
);
assert.deepEqual(
  getLifetimeStatistics({
    readingCompleted: Number.POSITIVE_INFINITY,
    listeningCompleted: Number.NEGATIVE_INFINITY,
    writingCompleted: 0,
    wordsWritten: -10,
  }),
  {
    readingCompleted: null,
    listeningCompleted: null,
    writingCompleted: 0,
    wordsWritten: null,
  },
);
console.log("PASS partial errors, numeric strings, and non-finite values are handled");

assert.equal(formatLifetimeStatisticValue(1250, "en"), "1,250");
assert.equal(formatLifetimeStatisticValue(12400, "zh"), "12,400");
assert.equal(formatLifetimeStatisticValue(null, "en"), "—");
console.log("PASS Lifetime Statistics number formatting is readable");

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

assert.match(profilePageSource, /getLifetimeStatistics\(lifetimeStatisticsInput\)/);
assert.match(profilePageSource, /<LifetimeStatisticsCard/);
assert.match(profilePageSource, /profile\.statistics\.title/);
assert.match(profilePageSource, /formatLifetimeStatisticValue/);
assert.match(profilePageSource, /aria-busy=\{isLoading\}/);
assert.match(profilePageSource, /profile\.statistics\.unavailable/);
assert.match(profilePageSource, /sm:grid-cols-2 lg:grid-cols-4/);
assert.match(profilePageSource, /item\.value === null/);
assert.match(profilePageSource, /wordsWritten: 0/);
assert.doesNotMatch(profilePageSource, /aiFeedbackGenerated/);
assert.ok(
  profilePageSource.indexOf("<BestScoresCard") <
    profilePageSource.indexOf("<LifetimeStatisticsCard"),
  "Lifetime Statistics should appear after Best Scores",
);
assert.ok(
  profilePageSource.indexOf("<LifetimeStatisticsCard") <
    profilePageSource.indexOf('<div className="grid gap-6 xl:grid-cols'),
  "Lifetime Statistics should appear before membership/account content",
);
console.log("PASS Profile page renders Lifetime Statistics in the requested position");

assert.match(profileApiSource, /lifetime_statistics/);
assert.match(profileApiSource, /\.select\("id", \{ count: "exact", head: true \}\)/);
assert.match(profileApiSource, /\.eq\("skill", "reading"\)/);
assert.match(profileApiSource, /\.eq\("skill", "listening"\)/);
assert.match(profileApiSource, /\.from\("writing_attempts"\)/);
assert.match(profileApiSource, /\.select\("words_written:word_count\.sum\(\)"\)/);
assert.match(profileApiSource, /\.gte\("word_count", 0\)/);
assert.match(profileApiSource, /\.eq\("user_id", user\.id\)/);
assert.match(profileApiSource, /readingCompleted: readingCountResult\.error \? null/);
assert.match(profileApiSource, /listeningCompleted: listeningCountResult\.error/);
assert.match(profileApiSource, /writingCompleted: writingCountResult\.error \? null/);
assert.match(profileApiSource, /parseWordsWrittenAggregate/);
assert.doesNotMatch(profileApiSource, /aiFeedbackGenerated/);
assert.doesNotMatch(profileApiSource, /lifetime_statistics_error/);
console.log("PASS Profile API uses scoped database counts and word_count aggregate");

for (const key of [
  "profile.statistics.title",
  "profile.statistics.readingCompleted",
  "profile.statistics.listeningCompleted",
  "profile.statistics.writingCompleted",
  "profile.statistics.wordsWritten",
  "profile.statistics.unavailable",
]) {
  assert.equal(
    countOccurrences(messagesSource, `"${key}"`),
    2,
    `${key} should exist for English and Chinese`,
  );
}
assert.equal(
  countOccurrences(messagesSource, `"profile.statistics.aiFeedbackGenerated"`),
  0,
);
assert.match(messagesSource, /"profile\.statistics\.unavailable": "Data unavailable"/);
assert.match(messagesSource, /"profile\.statistics\.unavailable": "数据暂不可用"/);
console.log("PASS Lifetime Statistics i18n keys exist in English and Chinese");

function countOccurrences(value, pattern) {
  return value.split(pattern).length - 1;
}
