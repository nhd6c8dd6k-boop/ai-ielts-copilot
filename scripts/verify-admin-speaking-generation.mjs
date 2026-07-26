import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const require = createRequire(import.meta.url);
const zodImportUrl = pathToFileURL(require.resolve("zod")).href;
const tempDir = await mkdtemp(join(tmpdir(), "admin-speaking-generation-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

const sourcePath = new URL(
  "../src/server/services/admin-speaking-generation-schema.ts",
  import.meta.url,
);
const source = (await readFile(sourcePath, "utf8")).replace(
  'import { z } from "zod";',
  `import zodModule from ${JSON.stringify(zodImportUrl)};\nconst { z } = zodModule;`,
);
const compiled = ts.transpileModule(source, { compilerOptions });
const compiledPath = join(tempDir, "admin-speaking-generation-schema.mjs");
await writeFile(compiledPath, compiled.outputText);

const {
  adminGenerateSpeakingInputSchema,
  adminSpeakingPartOneOutputSchema,
  adminSpeakingPartTwoOutputSchema,
  adminSpeakingPartThreeOutputSchema,
  normalizeSpeakingSlug,
  validateAdminSpeakingContentPayload,
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

const teachingFields = {
  usefulPhrases: [
    {
      phrase: "a practical habit",
      meaning: "a useful routine",
      example: "Cooking is a practical habit.",
    },
    {
      phrase: "clear my head",
      meaning: "relax mentally",
      example: "Walking helps me clear my head.",
    },
  ],
  vocabulary: [
    {
      insteadOf: "very good",
      try: ["useful", "practical"],
      meaning: "helpful in real life",
      example: "It is a practical skill.",
      context: "daily skills",
    },
    {
      insteadOf: "very busy",
      try: ["packed", "demanding"],
      meaning: "having many things to do",
      example: "My schedule is packed.",
      context: "busy routine",
    },
  ],
  sentencePatterns: [
    {
      pattern: "One thing I like about ___ is ___.",
      example: "One thing I like about cooking is that it helps me relax.",
      suitableUse: "Explaining preference.",
    },
    {
      pattern: "It is not exactly ___, but ___.",
      example: "It is not exactly easy, but it is useful.",
      suitableUse: "Adding contrast.",
    },
  ],
  commonMistakes: [
    {
      incorrect: "I enjoy to cook.",
      better: "I enjoy cooking.",
      why: "Use enjoy + verb-ing.",
    },
    {
      incorrect: "It makes me relaxing.",
      better: "It makes me relaxed.",
      why: "Use relaxed for a feeling.",
    },
  ],
};

function partOneQuestion(order) {
  return {
    questionOrder: order,
    question: `Do you like cooking ${order}?`,
    answerTip: "Answer directly and add one reason.",
    directAnswer: "Yes, I enjoy cooking simple meals.",
    mainReason: "It helps me save money and choose healthier ingredients.",
    example: "For example, I often make soup after work.",
    alternativePerspective: "However, I prefer quick recipes on busy days.",
    sampleBand6:
      "Yes, I like cooking. I usually cook simple food at home, like noodles or vegetables. It is cheaper than eating out, and I can choose what I want to eat.",
    sampleBand7:
      "Yes, I enjoy cooking when I have enough time. I usually make simple home-style dishes because they are healthier and cheaper than takeaway. It also helps me relax after a long day.",
    sampleBand8:
      "I do enjoy cooking, although I would describe myself as practical rather than talented. Most of the time I make quick home-style meals, and I like the control it gives me over taste and ingredients.",
    ...teachingFields,
  };
}

function partTwoQuestion() {
  return {
    questionOrder: 1,
    question: "Describe a useful skill you learned.",
    answerTip: "Choose one specific skill and include a short story.",
    cueCardPoints: [
      "what the skill is",
      "when you learned it",
      "how you learned it",
      "and explain why it is useful",
    ],
    preparationIdeas: [
      "choose cooking",
      "learned at home",
      "mother showed basic steps",
      "useful for saving money",
    ],
    suggestedStructure: [
      "Introduction",
      "Background",
      "Learning process",
      "Why it matters",
    ],
    sampleBand6:
      "I would like to talk about cooking. I learned it when I started living away from home. At first, I only knew how to make noodles, but my mother taught me some simple dishes. Now I can cook vegetables, soup, and rice. It is useful because I do not need to buy takeaway every day. It also saves money and helps me eat healthier food. I am not a very good cook, but I feel more independent because of this skill.",
    sampleBand7:
      "I would like to describe cooking, which is a practical skill I learned after moving away from home. At the beginning, I could only make very basic food, so I often called my mother and asked for advice. She taught me how to prepare simple dishes, such as soup and stir-fried vegetables. What made the skill useful was not just the food itself, but the sense of independence it gave me. I could control what I ate, spend less money on takeaway, and look after myself more responsibly. I still make mistakes, but cooking has become a calming part of my routine.",
    sampleBand8:
      "A useful skill I learned is cooking, not in a professional sense, but as a practical life skill. I picked it up properly when I first lived away from my family. At that time, I relied too much on takeaway, so my mother began teaching me simple recipes over video calls. Gradually, I learned how to season soup, prepare vegetables, and plan basic meals for the week. What I value most is the independence behind it. Cooking gives me control over my health, my budget, and even my mood, because making a warm meal after a stressful day can feel surprisingly grounding.",
    ...teachingFields,
  };
}

function partThreeQuestion(order) {
  return {
    questionOrder: order,
    question: `Why do some people prefer practical skills ${order}?`,
    answerTip: "Give a clear opinion, reason, example, and contrast.",
    directAnswer: "Many people prefer practical skills because they are useful immediately.",
    mainReason:
      "They can solve everyday problems and make people feel more independent.",
    example:
      "For instance, cooking, budgeting, and basic repair skills reduce dependence on others.",
    alternativePerspective:
      "However, academic knowledge is still important for long-term development.",
    sampleBand6:
      "I think people like practical skills because they can use them in daily life. For example, cooking and driving are useful almost every day. These skills also make people feel independent. However, academic subjects are still important for future jobs.",
    sampleBand7:
      "Many people prefer practical skills because the benefits are immediate and easy to see. If someone can cook, manage money, or fix basic problems at home, they feel more independent. For example, a student who can prepare simple meals may save money and live more healthily. That said, practical skills should not completely replace academic learning.",
    sampleBand8:
      "I think practical skills appeal to people because they create a direct sense of usefulness. Academic knowledge can be valuable, but its benefits may feel distant, whereas skills like cooking, budgeting, or communicating clearly improve daily life almost immediately. For example, a young adult who can manage expenses is less likely to depend heavily on family support. Still, the strongest education probably combines practical competence with deeper academic understanding.",
    ...teachingFields,
  };
}

function baseTopic(part, overrides = {}) {
  return {
    title: part === 2 ? "Describe a Useful Skill" : "Cooking",
    slug: part === 2 ? "part-2-useful-skill" : "cooking",
    description: "IELTS Speaking preparation content about everyday skills.",
    part,
    targetBand: 7,
    ...overrides,
  };
}

function partOnePayload(overrides = {}) {
  return {
    topic: baseTopic(1),
    questions: [partOneQuestion(1), partOneQuestion(2), partOneQuestion(3)],
    ...overrides,
  };
}

function partTwoPayload(overrides = {}) {
  return {
    topic: baseTopic(2),
    questions: [partTwoQuestion()],
    ...overrides,
  };
}

function partThreePayload(overrides = {}) {
  return {
    topic: baseTopic(3),
    questions: [partThreeQuestion(1), partThreeQuestion(2), partThreeQuestion(3)],
    ...overrides,
  };
}

assert.doesNotThrow(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 1,
    topic: "Cooking",
    targetBand: 7,
    questionCount: 5,
  }),
);
assert.doesNotThrow(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 2,
    topic: "A useful skill",
    targetBand: 7,
    questionCount: 1,
  }),
);
assert.doesNotThrow(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 3,
    topic: "Technology and education",
    targetBand: 7,
    questionCount: 4,
  }),
);
assert.throws(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 4,
    topic: "Cooking",
    targetBand: 7,
    questionCount: 5,
  }),
);
assert.throws(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 2,
    topic: "A useful skill",
    targetBand: 7,
    questionCount: 2,
  }),
);
assert.throws(() =>
  adminGenerateSpeakingInputSchema.parse({
    part: 1,
    topic: "Cooking",
    targetBand: 7,
    questionCount: 7,
  }),
);
console.log("PASS Speaking generation input validation");

for (const schema of [
  adminSpeakingPartOneOutputSchema,
  adminSpeakingPartTwoOutputSchema,
  adminSpeakingPartThreeOutputSchema,
]) {
  const jsonSchema = schema.toJSONSchema();
  assert.deepEqual(findKeys(jsonSchema, "oneOf"), []);
  assert.deepEqual(findKeys(jsonSchema, "anyOf"), []);
}
console.log("PASS Speaking output schemas avoid oneOf/anyOf");

assert.doesNotThrow(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 1, topic: "Cooking", targetBand: 7, questionCount: 3 },
    payload: partOnePayload(),
  }),
);
assert.doesNotThrow(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 2, topic: "A useful skill", targetBand: 7, questionCount: 1 },
    payload: partTwoPayload(),
  }),
);
assert.doesNotThrow(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 3, topic: "Technology", targetBand: 7, questionCount: 3 },
    payload: partThreePayload(),
  }),
);
console.log("PASS valid Part 1, Part 2, and Part 3 output fixtures");

assert.throws(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 2, topic: "A useful skill", targetBand: 7, questionCount: 1 },
    payload: partTwoPayload({
      questions: [{ ...partTwoQuestion(), cueCardPoints: undefined }],
    }),
  }),
);
assert.throws(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 1, topic: "Cooking", targetBand: 7, questionCount: 1 },
    payload: {
      topic: baseTopic(1),
      questions: [partTwoQuestion()],
    },
  }),
);
assert.throws(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 1, topic: "Cooking", targetBand: 7, questionCount: 3 },
    payload: partOnePayload({
      questions: [
        {
          ...partOneQuestion(1),
          vocabulary: [{ ...teachingFields.vocabulary[0], context: undefined }],
        },
        partOneQuestion(2),
        partOneQuestion(3),
      ],
    }),
  }),
);
assert.throws(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 3, topic: "Technology", targetBand: 7, questionCount: 3 },
    payload: partThreePayload({
      questions: [
        { ...partThreeQuestion(1), sampleBand7: undefined },
        partThreeQuestion(2),
        partThreeQuestion(3),
      ],
    }),
  }),
);
assert.throws(() =>
  validateAdminSpeakingContentPayload({
    input: { part: 3, topic: "Technology", targetBand: 7, questionCount: 4 },
    payload: partThreePayload(),
  }),
);
console.log("PASS invalid Speaking output fixtures are rejected");

assert.equal(
  normalizeSpeakingSlug(" Part 2: A Useful Skill! ", "fallback-topic"),
  "part-2-a-useful-skill",
);
assert.equal(normalizeSpeakingSlug("!!", "Helpful Person"), "helpful-person");
console.log("PASS Speaking slug normalization");

const serviceSource = await readFile(
  new URL("../src/server/services/admin-ai-content.ts", import.meta.url),
  "utf8",
);
assert.match(serviceSource, /source_type:\s*"ai_generated"/);
assert.match(serviceSource, /status:\s*"review"/);
assert.match(serviceSource, /\.from\("speaking_topics"\)\.delete\(\)\.eq\("id", topic\.id\)/);
assert.match(serviceSource, /action:\s*"ai_speaking_generated"/);
console.log("PASS Speaking persistence source, review status, rollback cleanup, and admin log are wired");
