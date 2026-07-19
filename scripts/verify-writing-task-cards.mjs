import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const tempDir = await mkdtemp(join(tmpdir(), "writing-task-cards-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

async function compileSource(sourceFileName, outputFileName) {
  const sourcePath = new URL(`../src/${sourceFileName}`, import.meta.url);
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions });
  const compiledPath = join(tempDir, outputFileName);
  await writeFile(compiledPath, compiled.outputText);
  return compiledPath;
}

const displayModulePath = await compileSource(
  "lib/writing-task-display.ts",
  "writing-task-display.mjs",
);
const {
  getWritingDisplayTitle,
  getWritingQuestionTypeLabel,
  inferWritingQuestionType,
  isGenericWritingTitle,
} = await import(`file://${displayModulePath}`);

const educationPracticalPrompt =
  "Some people believe that schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?";
const educationOnlinePrompt =
  "Some people think that online learning should replace classroom education, while others believe face-to-face lessons are still more effective. Discuss both views and give your own opinion.";
const technologyAiPrompt =
  "More people are using artificial intelligence tools for study and work. What are the advantages and disadvantages of this trend?";
const technologyWorkPrompt =
  "Some people believe that artificial intelligence will replace many types of human work in the future. To what extent do you agree or disagree?";

const educationPracticalTitle = getWritingDisplayTitle({
  taskType: 2,
  topic: "Education",
  title: "Task 2: Education",
  prompt: educationPracticalPrompt,
});
const educationOnlineTitle = getWritingDisplayTitle({
  taskType: 2,
  topic: "Education",
  title: "Task 2: Education",
  prompt: educationOnlinePrompt,
});
const technologyAiTitle = getWritingDisplayTitle({
  taskType: 2,
  topic: "Technology",
  title: "Task 2: Technology",
  prompt: technologyAiPrompt,
});
const technologyWorkTitle = getWritingDisplayTitle({
  taskType: 2,
  topic: "Technology",
  title: "Task 2: Technology",
  prompt: technologyWorkPrompt,
});

assert.notEqual(educationPracticalTitle, "Task 2: Education");
assert.notEqual(educationPracticalTitle, educationOnlineTitle);
assert.notEqual(technologyAiTitle, technologyWorkTitle);
assert.match(educationPracticalTitle, /Practical Skills|Academic Subjects/);
console.log("PASS generic Task 2 topic titles become distinct display titles");

assert.equal(
  getWritingDisplayTitle({
    taskType: 2,
    topic: "Technology",
    title: "AI Tools for Study and Work",
    prompt: technologyAiPrompt,
  }),
  "AI Tools for Study and Work",
);
console.log("PASS custom non-generic title is preserved");

assert.equal(
  getWritingDisplayTitle({
    taskType: 1,
    topic: "Lifestyle / Economy",
    title: "Task 1: Lifestyle / Economy",
    prompt:
      "The pie chart below shows how an average household spent its monthly income in one city in 2025.",
    visualTitle: "Household spending in 2025",
  }),
  "Household Spending in 2025",
);
const task1PromptFallbackTitle = getWritingDisplayTitle({
  taskType: 1,
  topic: "Transport / Public Services",
  title: "Task 1: Transport / Public Services",
  prompt:
    "The table below shows the percentage of passengers satisfied with different aspects of public transport in three cities.",
});
assert.match(task1PromptFallbackTitle, /Passengers Satisfied/);
assert.ok(task1PromptFallbackTitle.split(/\s+/).length <= 9);
console.log("PASS Task 1 display titles use visual title or prompt fallback");

assert.equal(isGenericWritingTitle("Task 2: Education", "Education"), true);
assert.equal(isGenericWritingTitle("Writing Task 2", "Education"), true);
assert.equal(isGenericWritingTitle("Education", "Education"), true);
assert.equal(isGenericWritingTitle("Online Learning vs Classroom Education", "Education"), false);
console.log("PASS generic writing titles are detected");

assert.equal(
  getWritingQuestionTypeLabel(educationPracticalPrompt),
  "Agree or Disagree",
);
assert.equal(
  getWritingQuestionTypeLabel(educationOnlinePrompt),
  "Discuss Both Views",
);
assert.equal(
  getWritingQuestionTypeLabel(technologyAiPrompt),
  "Advantages and Disadvantages",
);
assert.equal(
  getWritingQuestionTypeLabel(
    "Many cities are facing increasing air pollution and traffic congestion. What are the main causes of these problems, and what solutions can be suggested?",
  ),
  "Causes and Solutions",
);
assert.equal(
  getWritingQuestionTypeLabel(
    "Why do some people prefer public transport? What can governments do to improve it?",
  ),
  "Two-part Question",
);
assert.equal(
  getWritingQuestionTypeLabel(
    "Some people say that the growth of international tourism is a positive or negative development. Discuss.",
  ),
  "Positive or Negative Development",
);
assert.equal(inferWritingQuestionType("Write about this topic."), "essay_question");
console.log("PASS Task 2 question type labels are mapped and inferred");

const pageSource = await readFile(
  new URL("../src/app/practice/writing/page.tsx", import.meta.url),
  "utf8",
);
assert.equal(pageSource.includes('label="Task type"'), false);
assert.equal(pageSource.includes('labelKey="practice.taskType"'), false);
assert.equal(pageSource.includes('label="Added"'), false);
assert.equal(pageSource.includes('labelKey="practice.added"'), false);
assert.match(pageSource, /line-clamp-2/);
assert.match(pageSource, /flex-wrap/);
console.log("PASS Writing list card removes repeated Task type/Added and keeps responsive classes");
