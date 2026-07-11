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

export function createMockWritingFeedback(
  essay: string,
  language: "zh" | "en" = "en",
): WritingFeedback {
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
      language === "zh"
        ? "这篇作文基本回应了题目，也有可见的段落结构。想提高分数，需要把中心立场写得更明确，并用更具体的例子和解释支撑每个主体段。"
        : "The essay addresses the task and shows a workable structure. To move higher, make the central position more explicit and develop each body paragraph with clearer examples and explanation.",
    scoreSummary:
      language === "zh"
        ? [
            "观点基本相关，但主体段展开还不够具体。",
            "结构可以看懂，但衔接有时比较机械。",
            "下一步重点练习用具体例子支撑每个观点。",
          ]
        : [
            "The ideas are relevant, but the body paragraphs need more specific development.",
            "The structure is clear enough, but cohesion is sometimes mechanical.",
            "Next focus: practise supporting each main idea with concrete examples.",
          ],
    grammarIssues:
      language === "zh"
        ? [
            "检查长句里的主谓一致。",
            "避免连接词后出现句子残缺。",
            "单数可数名词前注意冠词使用。",
          ]
        : [
            "Check subject-verb agreement in longer sentences.",
            "Avoid sentence fragments after transition phrases.",
            "Use articles consistently before singular countable nouns.",
          ],
    vocabularyUpgrades:
      language === "zh"
        ? [
            "important -> significant / crucial：让表达更具体。",
            "bad effects -> adverse consequences：更适合学术写作。",
            "help students -> support learners / improve learning outcomes：减少重复。",
          ]
        : [
            "important -> significant / crucial",
            "bad effects -> adverse consequences",
            "help students -> support learners / improve learning outcomes",
          ],
    sentenceImprovements:
      language === "zh"
        ? [
            {
              original: "Schools should focus more on practical skills.",
              improved:
                "Schools should place greater emphasis on practical skills while still maintaining academic depth.",
              explanation:
                "修改后表达更正式，也避免把 academic subjects 完全排除在外，观点更有 IELTS Task 2 的平衡感。",
            },
            {
              original: "It can help students in the future.",
              improved:
                "This can help students manage real-life responsibilities more confidently after graduation.",
              explanation:
                "原句比较笼统；修改后说明了具体帮助对象和场景，论证更清楚。",
            },
          ]
        : [
            {
              original: "Schools should focus more on practical skills.",
              improved:
                "Schools should place greater emphasis on practical skills while still maintaining academic depth.",
              explanation:
                "The improved sentence is more formal and gives a more balanced position.",
            },
            {
              original: "It can help students in the future.",
              improved:
                "This can help students manage real-life responsibilities more confidently after graduation.",
              explanation:
                "The original is too general; the improved version explains the benefit more specifically.",
            },
          ],
    taskSpecificFeedback:
      language === "zh"
        ? {
            taskType: "task2",
            items: [
              {
                label: "立场 Position",
                status: hasClearPosition ? "strong" : "needs_work",
                feedback: hasClearPosition
                  ? "文章有明确回应题目，但开头可以更直接说明同意程度。"
                  : "立场不够明确，需要在 introduction 里清楚回答题目。",
              },
              {
                label: "观点展开 Idea development",
                status: "needs_work",
                feedback: "主体段观点相关，但解释和因果展开还不够充分。",
              },
              {
                label: "例子 Examples",
                status: "needs_work",
                feedback: "例子偏泛，需要加入更具体的学习或工作场景。",
              },
              {
                label: "段落结构 Paragraphing",
                status: "strong",
                feedback: "段落结构基本清楚，但段落内部衔接可以更自然。",
              },
              {
                label: "任务回应 Task response",
                status: "needs_work",
                feedback: "整体回应题目，但需要更深入解释为什么这个观点成立。",
              },
            ],
          }
        : {
            taskType: "task2",
            items: [
              {
                label: "Position",
                status: hasClearPosition ? "strong" : "needs_work",
                feedback: hasClearPosition
                  ? "The essay answers the question, but the extent of agreement could be stated more directly."
                  : "The position is not clear enough and should be stated in the introduction.",
              },
              {
                label: "Idea development",
                status: "needs_work",
                feedback:
                  "The main ideas are relevant, but the explanation and cause-effect development need more detail.",
              },
              {
                label: "Examples",
                status: "needs_work",
                feedback:
                  "The examples are quite general and need a more specific study or workplace context.",
              },
              {
                label: "Paragraphing",
                status: "strong",
                feedback:
                  "The paragraph structure is generally clear, though internal cohesion could be smoother.",
              },
              {
                label: "Task response",
                status: "needs_work",
                feedback:
                  "The response addresses the task, but it needs deeper explanation of why the view is valid.",
              },
            ],
          },
    band7Sample:
      "A Band 7 response would present a clear position, develop two main ideas logically, and use a range of vocabulary with only occasional awkward phrasing.",
    band8Sample:
      "A Band 8 response would extend each argument with precise examples, maintain strong paragraph progression, and use flexible grammar with few noticeable errors.",
    band9Sample:
      "A Band 9 response would offer a fully developed, nuanced argument with natural cohesion, precise academic vocabulary, and consistently accurate complex structures.",
    nextSteps:
      language === "zh"
        ? [
            "重写 introduction，让 thesis sentence 更清楚。",
            "每个主体段加入一个具体例子。",
            "提交前检查冠词和句子边界。",
          ]
        : [
            "Rewrite the introduction with a clearer thesis sentence.",
            "Add one concrete example to each body paragraph.",
            "Review article use and sentence boundaries before submitting again.",
          ],
  };
}
