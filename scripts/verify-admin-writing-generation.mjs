import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const require = createRequire(import.meta.url);
const zodImportUrl = pathToFileURL(require.resolve("zod")).href;
const tempDir = await mkdtemp(join(tmpdir(), "admin-writing-generation-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

const sourcePath = new URL(
  "../src/server/services/admin-writing-generation-schema.ts",
  import.meta.url,
);
const source = (await readFile(sourcePath, "utf8")).replace(
  'import { z } from "zod";',
  `import zodModule from ${JSON.stringify(zodImportUrl)};\nconst { z } = zodModule;`,
);
const compiled = ts.transpileModule(source, { compilerOptions });
const compiledPath = join(tempDir, "admin-writing-generation-schema.mjs");
await writeFile(compiledPath, compiled.outputText);

const {
  adminWritingOutputSchema,
  normalizeAdminWritingVisualDataForStorage,
  normalizeWritingTitleKey,
  validateGeneratedWritingTitle,
  validateAdminWritingContentPayload,
} = await import(`file://${compiledPath}`);

function findKeys(value, key, path = "$", matches = []) {
  if (!value || typeof value !== "object") {
    return matches;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findKeys(item, key, `${path}[${index}]`, matches));
    return matches;
  }

  for (const [objectKey, objectValue] of Object.entries(value)) {
    const nextPath = `${path}.${objectKey}`;

    if (objectKey === key) {
      matches.push(nextPath);
    }

    findKeys(objectValue, key, nextPath, matches);
  }

  return matches;
}

function basePayload(overrides = {}) {
  return {
    title: "AI Tools in Modern Education",
    task_type: 2,
    band_target: 7,
    topic: "Technology",
    prompt:
      "Some people believe that artificial intelligence tools are useful for education. To what extent do you agree or disagree?",
    sample_answer_band_7: "A sample answer at Band 7.",
    sample_answer_band_8: "A sample answer at Band 8.",
    sample_answer_band_9: "A sample answer at Band 9.",
    scoring_notes: ["Assess task response, cohesion, vocabulary and grammar."],
    visual_data: noneVisual(),
    ...overrides,
  };
}

function noneVisual(overrides = {}) {
  return {
    type: "none",
    title: "",
    description: "",
    xKey: "",
    unit: "",
    categories: [],
    series: [],
    table_headers: [],
    table_rows: [],
    stages: [],
    is_cycle: false,
    ...overrides,
  };
}

function chartVisual(type, overrides = {}) {
  return {
    type,
    title: "Internet use by age group",
    description: "The chart compares regular internet use by age group.",
    xKey: "Age group",
    unit: "%",
    categories: ["16-24", "25-44", "45-64"],
    series: [
      { name: "2010", values: [85, 72, 40] },
      { name: "2025", values: [98, 90, 75] },
    ],
    table_headers: [],
    table_rows: [],
    stages: [],
    is_cycle: false,
    ...overrides,
  };
}

const jsonSchema = adminWritingOutputSchema.toJSONSchema();
assert.deepEqual(findKeys(jsonSchema, "oneOf"), []);
assert.equal(findKeys(jsonSchema, "anyOf").length, 0);
assert.equal(jsonSchema.properties.title.type, "string");
assert.deepEqual(
  jsonSchema.properties.visual_data.required,
  [
    "type",
    "title",
    "description",
    "xKey",
    "unit",
    "categories",
    "series",
    "table_headers",
    "table_rows",
    "stages",
    "is_cycle",
  ],
);
assert.equal(jsonSchema.properties.visual_data.additionalProperties, false);
console.log("PASS admin writing JSON schema has fixed visual_data shape");

for (const invalidTitle of [
  "Task 2: Education",
  "Education",
  "Writing Task 2",
  "Discuss Both Views",
  "A Bar Chart",
  "Remote Work?",
  "AI",
  "This Is a Very Long Writing Task Title That Goes Well Beyond Twelve Words",
]) {
  assert.throws(() =>
    validateGeneratedWritingTitle({
      title: invalidTitle,
      topic: "Education",
      prompt:
        "Some people think remote work is more productive than office work. Discuss both views and give your opinion.",
    }),
  );
}
console.log("PASS generic, punctuation, too-short, and too-long titles are rejected");

for (const validTitle of [
  "Remote Work and Office Productivity",
  "Practical Skills in School Education",
  "Household Spending by Category",
]) {
  assert.doesNotThrow(() =>
    validateGeneratedWritingTitle({
      title: validTitle,
      topic: "Education",
      prompt:
        "Some people think remote work is more productive than office work. Discuss both views and give your opinion.",
    }),
  );
}
console.log("PASS specific standalone writing titles are accepted");

assert.equal(
  normalizeWritingTitleKey("Remote Work and Office Productivity!"),
  normalizeWritingTitleKey("remote work and office productivity"),
);
const batchKeys = new Set();
const firstTitleKey = normalizeWritingTitleKey("Remote Work and Office Productivity");
assert.equal(batchKeys.has(firstTitleKey), false);
batchKeys.add(firstTitleKey);
assert.equal(
  batchKeys.has(normalizeWritingTitleKey("remote-work and office productivity")),
  true,
);
console.log("PASS duplicate title keys are case and punctuation insensitive");

const task2Payload = validateAdminWritingContentPayload(basePayload());
assert.equal(task2Payload.visual_data.type, "none");
assert.equal(normalizeAdminWritingVisualDataForStorage(task2Payload.visual_data), null);
console.log("PASS Task 2 visual_data none fixture parses");

for (const type of ["bar_chart", "line_chart", "pie_chart"]) {
  const payload = validateAdminWritingContentPayload(
    basePayload({ task_type: 1, visual_data: chartVisual(type) }),
  );
  const stored = normalizeAdminWritingVisualDataForStorage(payload.visual_data);
  assert.equal(stored.type, type);
  assert.equal(stored.xKey, "Age group");
  assert.equal(stored.data.length, 3);
  assert.equal(stored.series.length, 2);
  console.log(`PASS Task 1 ${type} fixture parses and normalizes`);
}

const tablePayload = validateAdminWritingContentPayload(
  basePayload({
    task_type: 1,
    visual_data: noneVisual({
      type: "table",
      title: "Public transport satisfaction",
      description: "The table shows passenger satisfaction in three cities.",
      unit: "%",
      table_headers: ["Aspect", "City A", "City B", "City C"],
      table_rows: [
        ["Punctuality", "78", "65", "72"],
        ["Cleanliness", "82", "70", "76"],
      ],
    }),
  }),
);
const storedTable = normalizeAdminWritingVisualDataForStorage(tablePayload.visual_data);
assert.equal(storedTable.type, "table");
assert.equal(storedTable.series.length, 3);
assert.equal(storedTable.data.length, 2);
console.log("PASS Task 1 table fixture parses and normalizes");

const processPayload = validateAdminWritingContentPayload(
  basePayload({
    task_type: 1,
    visual_data: noneVisual({
      type: "process_diagram",
      title: "Plastic bottle recycling",
      description: "The diagram shows the recycling process.",
      stages: [
        { label: "Collection", description: "Bottles are collected." },
        { label: "Sorting", description: "Bottles are sorted." },
        { label: "Manufacturing", description: "New products are made." },
      ],
    }),
  }),
);
const storedProcess = normalizeAdminWritingVisualDataForStorage(
  processPayload.visual_data,
);
assert.equal(storedProcess.type, "process_diagram");
assert.equal(storedProcess.stages.length, 3);
console.log("PASS Task 1 process diagram fixture parses and normalizes");

assert.throws(() =>
  validateAdminWritingContentPayload(
    basePayload({
      task_type: 1,
      visual_data: chartVisual("bar_chart", {
        series: [{ name: "2010", values: [85, 72] }],
      }),
    }),
  ),
);
console.log("PASS chart category/value length mismatch is rejected");

assert.throws(() =>
  validateAdminWritingContentPayload(
    basePayload({
      task_type: 2,
      visual_data: chartVisual("bar_chart"),
    }),
  ),
);
console.log("PASS Task 2 rejects non-none visual_data");

assert.throws(() =>
  validateAdminWritingContentPayload(
    basePayload({
      task_type: 2,
      visual_data: noneVisual({ categories: ["Unexpected"] }),
    }),
  ),
);
console.log("PASS visual_data none rejects non-empty arrays");

const legacyChart = {
  type: "bar_chart",
  title: "Legacy chart",
  description: "Legacy visual_data is still handled by the renderer schema.",
  xKey: "field",
  series: [{ key: "2025", label: "2025" }],
  data: [{ field: "Business", "2025": 12000 }],
  unit: "students",
};
assert.equal(legacyChart.type, "bar_chart");
console.log("PASS legacy visual_data remains a separate renderer-compatible shape");

const migrationSource = await readFile(
  new URL("../supabase/migrations/009_add_writing_task_title.sql", import.meta.url),
  "utf8",
);
assert.match(migrationSource, /alter table public\.writing_tasks/i);
assert.match(migrationSource, /add column if not exists title text/i);
assert.equal(/not null/i.test(migrationSource), false);
console.log("PASS writing_tasks.title migration is nullable text and idempotent");

const adminAiContentSource = await readFile(
  new URL("../src/server/services/admin-ai-content.ts", import.meta.url),
  "utf8",
);
for (const removedRuntimeFallback of [
  "writingTaskTitleColumnAvailable",
  "insertWritingTaskWithOptionalTitle",
  "isMissingWritingTitleColumnError",
  "retry without title",
  "fallback insert",
  "title column does not exist",
  "schema cache",
  "PGRST204",
  "undefined column",
]) {
  assert.equal(
    adminAiContentSource.includes(removedRuntimeFallback),
    false,
    `${removedRuntimeFallback} should not remain in writing title persistence code`,
  );
}
assert.match(adminAiContentSource, /title:\s*data\.title\.trim\(\)/);
assert.match(
  adminAiContentSource,
  /\.select\("id,title,topic,band_target,status"\)/,
);
assert.match(
  adminAiContentSource,
  /\.select\("id,title,task_type,topic,prompt,visual_data,status"\)/,
);
assert.match(adminAiContentSource, /title:\s*task\.title/);
console.log("PASS Admin Writing generation saves title directly and loads persisted titles for duplicate checks");

const writingPracticeSource = await readFile(
  new URL("../src/server/services/writing-practice.ts", import.meta.url),
  "utf8",
);
assert.match(
  writingPracticeSource,
  /\.select\("id,title,task_type,topic,prompt,visual_data,band_target,created_at"\)/,
);
assert.match(writingPracticeSource, /title:\s*task\.title/);
assert.match(writingPracticeSource, /title:\s*data\.title/);
console.log("PASS Writing practice reads persisted title before display fallback");

const adminDashboardSource = await readFile(
  new URL("../src/server/services/admin-dashboard.ts", import.meta.url),
  "utf8",
);
assert.match(
  adminDashboardSource,
  /\.select\("id,title,task_type,topic,prompt,visual_data,source_type,status,created_at"\)/,
);
assert.match(adminDashboardSource, /getWritingDisplayTitle\(/);
console.log("PASS Admin list uses persisted writing title with display fallback");

const adminDetailSource = await readFile(
  new URL("../src/app/api/admin/content/detail/route.ts", import.meta.url),
  "utf8",
);
assert.match(
  adminDetailSource,
  /\.select\(\s*"id,title,task_type,topic,prompt,visual_data,/,
);
assert.match(adminDetailSource, /buildWritingDetailTitle\(data\)/);
assert.match(adminDetailSource, /const normalizedWritingTitle/);
assert.match(adminDetailSource, /title:\s*normalizedWritingTitle/);
console.log("PASS Admin detail and edit include persisted writing title");
