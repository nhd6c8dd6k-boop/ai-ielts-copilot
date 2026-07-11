import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const tempDir = await mkdtemp(join(tmpdir(), "writing-scoring-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

async function compileService(sourceFileName, outputFileName) {
  const sourcePath = new URL(`../src/server/services/${sourceFileName}`, import.meta.url);
  const source = await readFile(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions });
  const compiledPath = join(tempDir, outputFileName);
  await writeFile(compiledPath, compiled.outputText);
  return compiledPath;
}

const compiledPath = await compileService("writing-scoring.ts", "writing-scoring.mjs");
const sanitizerPath = await compileService(
  "writing-feedback-sanitizer.ts",
  "writing-feedback-sanitizer.mjs",
);
const { calibrateWritingScores } = await import(`file://${compiledPath}`);
const { sanitizeScoreSummaryBands } = await import(`file://${sanitizerPath}`);

const sanitizedSummary = sanitizeScoreSummaryBands([
  "TR 7.5: ideas are relevant but still general.",
  "Task Response: Band 7 should not remain in summary.",
  "CC 6.5 / LR 7 / GRA 7: fluent but uneven.",
  "The response is under 250 words and needs 3 paragraphs.",
  "下一步重点：不要写 TA 6.5 或 GRA Band 7.0 这种分数字样。",
]);

assert.equal(sanitizedSummary.some((item) => /\b(?:TR|TA|CC|LR|GRA)\s*(?:[:=]|[-–])?\s*(?:Band\s*)?[0-9]/i.test(item)), false);
assert.equal(sanitizedSummary.some((item) => /Task Response\s*:?\s*Band\s*7/i.test(item)), false);
assert.equal(sanitizedSummary.some((item) => /Band\s*[0-9](?:\.[05])?/i.test(item)), false);
assert.equal(sanitizedSummary.some((item) => /250 words/.test(item)), true);
assert.equal(sanitizedSummary.some((item) => /3 paragraphs/.test(item)), true);
assert.equal(sanitizedSummary.some((item) => /\s{2,}|^[\s:;,.=\-–]+|[\s:;,.=\-–]+$/.test(item)), false);
assert.equal(sanitizedSummary.some((item) => /(^|\s)\/($|\s|[:;,.=\-–])/.test(item)), false);
console.log("PASS score_summary sanitizer removes criterion bands and preserves word counts");

const task2WeakFeedback = {
  task_type: "task2",
  items: [
    { label: "Position", status: "needs_work" },
    { label: "Idea development", status: "missing" },
    { label: "Examples", status: "missing" },
    { label: "Paragraphing", status: "needs_work" },
    { label: "Task response", status: "missing" },
  ],
};

const task2MatureFeedback = {
  task_type: "task2",
  items: [
    { label: "Position", status: "strong" },
    { label: "Idea development", status: "strong" },
    { label: "Examples", status: "needs_work" },
    { label: "Paragraphing", status: "strong" },
    { label: "Task response", status: "strong" },
  ],
};

const task2StrongFeedback = {
  task_type: "task2",
  items: [
    { label: "Position", status: "strong" },
    { label: "Idea development", status: "strong" },
    { label: "Examples", status: "strong" },
    { label: "Paragraphing", status: "strong" },
    { label: "Task response", status: "strong" },
  ],
};

const task1NoOverviewFeedback = {
  task_type: "task1",
  items: [
    { label: "Overview", status: "missing" },
    { label: "Key features", status: "needs_work" },
    { label: "Data comparison", status: "needs_work" },
    { label: "Accuracy", status: "strong" },
    { label: "Objective reporting", status: "strong" },
  ],
};

const task1SevereComparisonFeedback = {
  task_type: "task1",
  items: [
    { label: "Overview", status: "strong" },
    { label: "Key features", status: "strong" },
    {
      label: "Data comparison",
      status: "needs_work",
      feedback:
        "There is little comparison and the response mostly describes without comparing.",
    },
    { label: "Accuracy", status: "strong" },
    { label: "Objective reporting", status: "strong" },
  ],
};

const task1MildComparisonFeedback = {
  task_type: "task1",
  items: [
    { label: "Overview", status: "strong" },
    { label: "Key features", status: "strong" },
    {
      label: "Data comparison",
      status: "needs_work",
      feedback:
        "The comparisons could be stronger with one more direct contrast between categories.",
    },
    { label: "Accuracy", status: "strong" },
    { label: "Objective reporting", status: "strong" },
  ],
};

const task1CompleteFeedback = {
  task_type: "task1",
  items: [
    { label: "Overview", status: "strong" },
    { label: "Key features", status: "strong" },
    { label: "Data comparison", status: "strong" },
    { label: "Accuracy", status: "strong" },
    { label: "Objective reporting", status: "strong" },
  ],
};

const cases = [
  {
    name: "Task 2 under 100 words is capped low",
    input: {
      taskType: 2,
      wordCount: 80,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 6.5,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 6.5,
      },
      taskSpecificFeedback: task2WeakFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 4.5, true);
      assert.equal(result.overallBand <= 5.5, true);
    },
  },
  {
    name: "Task 2 complete structure but weak development stays around 5.5-6.0",
    input: {
      taskType: 2,
      wordCount: 270,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 6.5,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 6.5,
      },
      taskSpecificFeedback: task2WeakFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 5.5, true);
      assert.equal(result.overallBand <= 6, true);
    },
  },
  {
    name: "Task 2 mature 6.5 is allowed but not inflated",
    input: {
      taskType: 2,
      wordCount: 285,
      criteria: {
        taskResponse: 6.5,
        coherenceCohesion: 6.5,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 6.5,
      },
      taskSpecificFeedback: task2MatureFeedback,
    },
    assert: (result) => {
      assert.equal(result.overallBand, 6.5);
    },
  },
  {
    name: "Task 1 without overview caps Task Achievement",
    input: {
      taskType: 1,
      wordCount: 175,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 6.5,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 6.5,
      },
      taskSpecificFeedback: task1NoOverviewFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 5.5, true);
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Task 1 severe weak comparison is limited",
    input: {
      taskType: 1,
      wordCount: 180,
      criteria: {
        taskResponse: 7.5,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task1SevereComparisonFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 6.5, true);
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Task 1 mature 7.0 is not capped for mild comparison needs-work",
    input: {
      taskType: 1,
      wordCount: 190,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task1MildComparisonFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse, 7);
      assert.equal(result.overallBand, 7);
    },
  },
  {
    name: "Task 1 complete data description can keep a strong score",
    input: {
      taskType: 1,
      wordCount: 190,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task1CompleteFeedback,
    },
    assert: (result) => {
      assert.equal(result.overallBand, 7);
    },
  },
  {
    name: "Task 2 limited idea development prevents CC/LR inflation",
    input: {
      taskType: 2,
      wordCount: 307,
      criteria: {
        taskResponse: 7.5,
        coherenceCohesion: 7.5,
        lexicalResource: 7.5,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: {
        task_type: "task2",
        items: [
          { label: "Position", status: "strong" },
          {
            label: "Idea development",
            status: "needs_work",
            feedback:
              "The explanation is underdeveloped and too general, with no specific example.",
          },
          { label: "Examples", status: "strong" },
          { label: "Paragraphing", status: "strong" },
          { label: "Task response", status: "strong" },
        ],
      },
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 6.5, true);
      assert.equal(result.coherenceCohesion <= 7, true);
      assert.equal(result.lexicalResource <= 7, true);
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Task 2 broad development and list-like examples cap overall at 6.5",
    input: {
      taskType: 2,
      wordCount: 305,
      criteria: {
        taskResponse: 6.5,
        coherenceCohesion: 7,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: {
        task_type: "task2",
        items: [
          { label: "Position", status: "strong" },
          {
            label: "Idea development",
            status: "needs_work",
            feedback:
              "Main ideas are relevant but developed in a broad way.",
          },
          {
            label: "Examples",
            status: "needs_work",
            feedback:
              "Examples mostly list situations rather than a specific illustrative case.",
          },
          { label: "Paragraphing", status: "strong" },
          { label: "Task response", status: "needs_work" },
        ],
      },
    },
    assert: (result) => {
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Task 2 mature 7.0 is not capped for mild idea-development needs-work",
    input: {
      taskType: 2,
      wordCount: 310,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: {
        task_type: "task2",
        items: [
          { label: "Position", status: "strong" },
          {
            label: "Idea development",
            status: "needs_work",
            feedback:
              "The ideas are relevant and developed, but examples could be more specific.",
          },
          { label: "Examples", status: "strong" },
          { label: "Paragraphing", status: "strong" },
          { label: "Task response", status: "strong" },
        ],
      },
    },
    assert: (result) => {
      assert.equal(result.taskResponse, 7);
      assert.equal(result.coherenceCohesion, 7);
      assert.equal(result.lexicalResource, 7);
      assert.equal(result.overallBand, 7);
    },
  },
  {
    name: "Task 2 mature 7.0 keeps mild idea and example needs-work",
    input: {
      taskType: 2,
      wordCount: 315,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: {
        task_type: "task2",
        items: [
          { label: "Position", status: "strong" },
          {
            label: "Idea development",
            status: "needs_work",
            feedback:
              "The position is clear and ideas are relevant, but the explanation could be deeper.",
          },
          {
            label: "Examples",
            status: "needs_work",
            feedback:
              "Examples are present and useful, but some could be more specific.",
          },
          { label: "Paragraphing", status: "strong" },
          { label: "Task response", status: "strong" },
        ],
      },
    },
    assert: (result) => {
      assert.equal(result.overallBand, 7);
    },
  },
  {
    name: "Task 2 mature 7.0 is not capped when evidence is strong",
    input: {
      taskType: 2,
      wordCount: 310,
      criteria: {
        taskResponse: 7,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task2StrongFeedback,
    },
    assert: (result) => {
      assert.equal(result.overallBand, 7);
    },
  },
  {
    name: "Advanced words misused do not keep Lexical Resource high",
    input: {
      taskType: 2,
      wordCount: 270,
      criteria: {
        taskResponse: 6.5,
        coherenceCohesion: 6.5,
        lexicalResource: 7.5,
        grammaticalRangeAccuracy: 6.5,
      },
      taskSpecificFeedback: {
        ...task2MatureFeedback,
        items: task2MatureFeedback.items.map((item) =>
          item.label === "Examples"
            ? {
                ...item,
                feedback:
                  "Vocabulary contains advanced words but collocation and word form errors make meaning less precise.",
              }
            : item,
        ),
      },
    },
    assert: (result) => {
      assert.equal(result.lexicalResource <= 6.5, true);
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Frequent errors in complex sentences cap Grammar",
    input: {
      taskType: 2,
      wordCount: 270,
      criteria: {
        taskResponse: 6.5,
        coherenceCohesion: 6.5,
        lexicalResource: 6.5,
        grammaticalRangeAccuracy: 7.5,
      },
      taskSpecificFeedback: {
        ...task2MatureFeedback,
        items: task2MatureFeedback.items.map((item) =>
          item.label === "Paragraphing"
            ? {
                ...item,
                feedback:
                  "Complex sentences frequently contain grammar errors, sentence fragments, and subject-verb agreement problems.",
              }
            : item,
        ),
      },
    },
    assert: (result) => {
      assert.equal(result.grammaticalRangeAccuracy <= 6.5, true);
      assert.equal(result.overallBand <= 6.5, true);
    },
  },
  {
    name: "Band 8+ still requires all criteria to support it",
    input: {
      taskType: 2,
      wordCount: 330,
      criteria: {
        taskResponse: 8.5,
        coherenceCohesion: 8,
        lexicalResource: 8,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task2StrongFeedback,
    },
    assert: (result) => {
      assert.equal(result.overallBand <= 7.5, true);
    },
  },
];

for (const testCase of cases) {
  const result = calibrateWritingScores(testCase.input);
  testCase.assert(result);
  console.log(`PASS ${testCase.name}: overall ${result.overallBand}`);
}
