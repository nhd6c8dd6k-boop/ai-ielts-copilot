import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const sourcePath = new URL("../src/server/services/writing-scoring.ts", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "writing-scoring-"));
const compiledPath = join(tempDir, "writing-scoring.mjs");
await writeFile(compiledPath, compiled.outputText);

const { calibrateWritingScores } = await import(`file://${compiledPath}`);

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

const task1LimitedComparisonFeedback = {
  task_type: "task1",
  items: [
    { label: "Overview", status: "strong" },
    { label: "Key features", status: "strong" },
    { label: "Data comparison", status: "needs_work" },
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
    name: "Task 1 overview with weak comparison is limited",
    input: {
      taskType: 1,
      wordCount: 180,
      criteria: {
        taskResponse: 7.5,
        coherenceCohesion: 7,
        lexicalResource: 7,
        grammaticalRangeAccuracy: 7,
      },
      taskSpecificFeedback: task1LimitedComparisonFeedback,
    },
    assert: (result) => {
      assert.equal(result.taskResponse <= 6.5, true);
      assert.equal(result.overallBand <= 7, true);
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
];

for (const testCase of cases) {
  const result = calibrateWritingScores(testCase.input);
  testCase.assert(result);
  console.log(`PASS ${testCase.name}: overall ${result.overallBand}`);
}
