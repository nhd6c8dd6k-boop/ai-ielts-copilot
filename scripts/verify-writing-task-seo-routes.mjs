import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const tempDir = await mkdtemp(join(tmpdir(), "writing-task-seo-routes-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

async function compileSource(sourceFileName, outputFileName, transform = (source) => source) {
  const sourcePath = new URL(`../src/${sourceFileName}`, import.meta.url);
  const source = transform(await readFile(sourcePath, "utf8"));
  const compiled = ts.transpileModule(source, { compilerOptions });
  const compiledPath = join(tempDir, outputFileName);
  await writeFile(compiledPath, compiled.outputText);
  return compiledPath;
}

const displayModulePath = await compileSource(
  "lib/writing-task-display.ts",
  "writing-task-display.mjs",
);
const slugModulePath = await compileSource(
  "lib/writing-task-slug.ts",
  "writing-task-slug.mjs",
  (source) =>
    source.replace(
      'import { isGenericWritingTitle } from "@/lib/writing-task-display";',
      `import { isGenericWritingTitle } from ${JSON.stringify(`file://${displayModulePath}`)};`,
    ),
);
const {
  buildUniqueWritingSlug,
  buildWritingSlugBase,
  isUuid,
  normalizeWritingSlug,
} = await import(`file://${slugModulePath}`);

assert.equal(normalizeWritingSlug("Working From Home"), "working-from-home");
assert.equal(normalizeWritingSlug("  AI, Education & Work!! "), "ai-education-work");
assert.equal(normalizeWritingSlug("---Multiple---Hyphens---"), "multiple-hyphens");
assert.equal(normalizeWritingSlug("中文标题"), "");
assert.equal(
  normalizeWritingSlug("A".repeat(140)),
  "a".repeat(100),
);
console.log("PASS Writing slug normalization handles casing, spaces, punctuation and length");

assert.equal(
  buildWritingSlugBase({
    taskType: 2,
    title: "Task 2: Work",
    topic: "Working from home",
  }),
  "ielts-writing-task-2-working-from-home",
);
assert.equal(
  buildWritingSlugBase({
    taskType: 1,
    title: "",
    topic: "Internet use by age group",
  }),
  "ielts-writing-task-1-internet-use-by-age-group",
);
assert.equal(
  buildWritingSlugBase({
    taskType: 2,
    title: "中文标题",
    topic: "教育",
    fallbackId: "12345678-1234-4234-9234-123456789abc",
  }),
  "ielts-writing-task-2-12345678",
);
console.log("PASS Writing slug base uses title, topic, then safe fallback");

assert.equal(
  buildUniqueWritingSlug({
    taskType: 2,
    title: "Working from Home",
    topic: "Work",
    existingSlugs: [],
  }),
  "working-from-home",
);
assert.equal(
  buildUniqueWritingSlug({
    taskType: 2,
    title: "Working from Home",
    topic: "Work",
    existingSlugs: ["working-from-home"],
  }),
  "working-from-home-2",
);
assert.equal(
  buildUniqueWritingSlug({
    taskType: 2,
    title: "Working from Home",
    topic: "Work",
    existingSlugs: ["working-from-home", "working-from-home-2"],
  }),
  "working-from-home-3",
);
console.log("PASS Writing slug collision suffixes are deterministic");

assert.equal(isUuid("12345678-1234-4234-9234-123456789abc"), true);
assert.equal(isUuid("working-from-home"), false);
console.log("PASS UUID detection keeps legacy route compatibility explicit");

const migrationSource = await readFile(
  new URL("../supabase/migrations/015_add_writing_task_slug.sql", import.meta.url),
  "utf8",
);
assert.match(migrationSource, /add column if not exists slug text/i);
assert.match(migrationSource, /alter column slug set not null/i);
assert.match(migrationSource, /create unique index if not exists writing_tasks_slug_idx/i);
assert.match(migrationSource, /where slug is null or btrim\(slug\) = ''/i);
console.log("PASS Writing slug migration adds, backfills and constrains slug");

const routeSource = await readFile(
  new URL("../src/app/practice/writing/[slug]/page.tsx", import.meta.url),
  "utf8",
);
assert.match(routeSource, /getPublishedWritingTaskBySlugOrId/);
assert.equal(
  routeSource.includes("permanentRedirect(`/practice/writing/${task.slug}`)"),
  true,
);
assert.match(routeSource, /canonical: url/);
assert.match(routeSource, /openGraph/);
assert.match(routeSource, /twitter/);
assert.doesNotMatch(routeSource, /params:\s*Promise<\{\s*id:/);
console.log("PASS Writing slug route resolves slug, redirects UUID and uses canonical metadata");

const listSource = await readFile(
  new URL("../src/app/practice/writing/page.tsx", import.meta.url),
  "utf8",
);
assert.match(listSource, /practice\/writing\/\$\{task\.slug\}/);
assert.doesNotMatch(listSource, /practice\/writing\/\$\{task\.id\}/);
console.log("PASS Writing library links use slug URLs");

const sitemapSource = await readFile(
  new URL("../src/app/sitemap.ts", import.meta.url),
  "utf8",
);
assert.match(sitemapSource, /getPublishedWritingSitemapEntries/);
assert.match(sitemapSource, /Promise\.allSettled/);
assert.match(sitemapSource, /practice\/writing\/\$\{task\.slug\}/);
assert.doesNotMatch(sitemapSource, /practice\/writing\/\$\{task\.id\}/);
console.log("PASS Sitemap includes published Writing slugs with safe fallback");

const adminGenerationSource = await readFile(
  new URL("../src/server/services/admin-ai-content.ts", import.meta.url),
  "utf8",
);
assert.match(adminGenerationSource, /createUniqueWritingTaskSlug/);
assert.match(adminGenerationSource, /slug,\s*\n\s*task_type:/);
console.log("PASS Admin AI Writing generation persists unique slugs");

const adminDetailSource = await readFile(
  new URL("../src/app/api/admin/content/detail/route.ts", import.meta.url),
  "utf8",
);
assert.match(adminDetailSource, /id,slug,title,task_type/);
assert.match(adminDetailSource, /slug: data\.slug/);
assert.doesNotMatch(adminDetailSource, /slug:\s*input\.data/);
console.log("PASS Admin Writing detail reads slug without updating it");

const adminConsoleSource = await readFile(
  new URL("../src/app/admin/admin-console.tsx", import.meta.url),
  "utf8",
);
assert.match(adminConsoleSource, /slug: string/);
assert.match(adminConsoleSource, /ReviewSection title="Slug"/);
assert.doesNotMatch(adminConsoleSource, /slug:\s*draft\./);
console.log("PASS Admin Writing UI exposes slug as read-only detail");

const seedSource = await readFile(
  new URL("../supabase/seed_writing_test_task.sql", import.meta.url),
  "utf8",
);
assert.match(seedSource, /slug,/);
assert.match(seedSource, /online-learning-vs-classroom-education-task-2/);
console.log("PASS Writing seed inserts a slug for new not-null schema");
