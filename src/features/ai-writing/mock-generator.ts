import type {
  GenerateWritingTaskInput,
  GeneratedWritingTask,
  WritingFeedback,
} from "@/features/ai-writing/schemas";

const task2Prompts: Record<GenerateWritingTaskInput["topic"], string> = {
  education:
    "Some people believe that schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?",
  technology:
    "Artificial intelligence is increasingly used in education and work. Do the advantages of this development outweigh the disadvantages?",
  environment:
    "Many governments invest in public transport to reduce pollution. Is this the most effective solution to environmental problems?",
  work: "More employees now work from home for part of the week. Do the benefits of this trend outweigh the drawbacks?",
  health:
    "Some people think governments should tax unhealthy food to improve public health. To what extent do you agree or disagree?",
  culture:
    "Local traditions are becoming less important in many countries. Is this a positive or negative development?",
  society:
    "In many cities, young people find it difficult to buy a home. What are the causes of this problem, and what solutions can you suggest?",
  random:
    "Artificial intelligence is increasingly used in education and work. Do the advantages of this development outweigh the disadvantages?",
};

export function createMockWritingTask(
  input: GenerateWritingTaskInput,
): GeneratedWritingTask {
  if (input.taskType === 1) {
    return {
      taskType: 1,
      topic: input.topic,
      targetBand: input.targetBand,
      title: "Task 1: University library visits",
      prompt:
        "The chart below shows the number of visits to a university library by students from three faculties between 2018 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      requirements: [
        "Write at least 150 words.",
        "Use an academic style.",
        "Do not invent exact figures that are not provided.",
      ],
    };
  }

  return {
    taskType: 2,
    topic: input.topic,
    targetBand: input.targetBand,
    title: "Task 2: Opinion essay",
    prompt: task2Prompts[input.topic],
    requirements: [
      "Write at least 250 words.",
      "Give reasons for your answer.",
      "Include relevant examples from your knowledge or experience.",
    ],
  };
}

export function createMockWritingFeedback(essay: string): WritingFeedback {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const lengthBand = wordCount >= 250 ? 7 : wordCount >= 180 ? 6.5 : 6;
  const hasClearPosition = /agree|disagree|advantages|disadvantages|causes|solutions/i.test(
    essay,
  );
  const overallBand = Math.min(8, lengthBand + (hasClearPosition ? 0.5 : 0));

  return {
    overallBand,
    criteria: {
      taskResponse: hasClearPosition ? overallBand : Math.max(5.5, overallBand - 0.5),
      coherenceCohesion: Math.max(5.5, overallBand - 0.5),
      lexicalResource: overallBand,
      grammaticalRangeAccuracy: Math.max(5.5, overallBand - 0.5),
    },
    feedback:
      "The essay addresses the task and shows a workable structure. To move higher, make the central position more explicit and develop each body paragraph with clearer examples and explanation.",
    scoreSummary: [
      "观点基本相关，但主体段展开还不够具体。 / The ideas are relevant, but the body paragraphs need more specific development.",
      "结构可以看懂，但衔接有时比较机械。 / The structure is clear enough, but cohesion is sometimes mechanical.",
      "下一步重点练习用具体例子支撑每个观点。 / Next focus: practise supporting each main idea with concrete examples.",
    ],
    grammarIssues: [
      "Check subject-verb agreement in longer sentences.",
      "Avoid sentence fragments after transition phrases.",
      "Use articles consistently before singular countable nouns.",
    ],
    vocabularyUpgrades: [
      "important -> significant / crucial",
      "bad effects -> adverse consequences",
      "help students -> support learners / improve learning outcomes",
    ],
    band7Sample:
      "A Band 7 response would present a clear position, develop two main ideas logically, and use a range of vocabulary with only occasional awkward phrasing.",
    band8Sample:
      "A Band 8 response would extend each argument with precise examples, maintain strong paragraph progression, and use flexible grammar with few noticeable errors.",
    band9Sample:
      "A Band 9 response would offer a fully developed, nuanced argument with natural cohesion, precise academic vocabulary, and consistently accurate complex structures.",
    nextSteps: [
      "Rewrite the introduction with a clearer thesis sentence.",
      "Add one concrete example to each body paragraph.",
      "Review article use and sentence boundaries before submitting again.",
    ],
  };
}
