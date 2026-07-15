import type { Language } from "@/lib/i18n/messages";

export const demoWritingPrompt =
  "Some people think employees should be allowed to work from home whenever possible, while others believe working in an office is more productive. Discuss both views and give your own opinion.";

export const demoWritingEssay = `Nowadays, working from home has become a common choice in many companies. Some people believe employees should have this freedom whenever the job allows it, because it can save travel time and make workers more comfortable. Others argue that office work is better for productivity because people can communicate quickly and managers can see the progress more clearly.

On the one hand, home working is good for workers because they can arrange their day in a flexible way. For example, a parent can start early, collect a child from school and finish tasks later. This kind of freedom may reduce stress and help people keep their job for longer. It can also help people focus on tasks such as writing reports or checking data, because they avoid some interruptions in a busy office. Also, companies can spend less money on office space if many staff stay at home.

On the other hand, working in an office can be more effective in some situations. When a team need to solve a problem quickly, face-to-face discussion is often faster than sending messages all day. New employees also learn better when they watch experienced colleagues and ask questions directly. If everyone works separately, the team spirit may become weaker.

In my opinion, employees should be allowed to work from home when their tasks are suitable, but it should not be the only option. A mixed system is the best solution, as workers can enjoy flexibility while still meeting colleagues regularly. However, companies need clear rules, because without them home working can make communication becomes slower and some people may feel isolated.`;

export const demoWritingScores = {
  overall: "6.5",
  taskResponse: "6.5",
  coherenceCohesion: "7.0",
  lexicalResource: "6.5",
  grammar: "6.5",
};

type DemoStatus = "strong" | "needs_work" | "missing";

type DemoLocalizedFeedback = {
  scoreSummary: string[];
  taskSpecific: Array<{
    label: string;
    status: DemoStatus;
    feedback: string;
  }>;
  detailedFeedback: string;
  grammarIssues: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
  vocabularyUpgrades: Array<{
    original: string;
    better: string;
    explanation: string;
  }>;
  sentenceImprovements: Array<{
    original: string;
    improved: string;
    why: string;
  }>;
  nextSteps: string[];
  sampleAnswerNote: string;
};

export const demoWritingFeedback: Record<Language, DemoLocalizedFeedback> = {
  en: {
    scoreSummary: [
      "The essay responds to the full question and presents a clear personal opinion.",
      "Paragraphing is generally clear, but some ideas are developed in a broad way.",
      "The examples are relevant, though they need more specific context or detail.",
      "Vocabulary has some range, but several expressions are repetitive or informal.",
      "Complex sentences are attempted, but accuracy problems still limit the writing.",
    ],
    taskSpecific: [
      {
        label: "Position",
        status: "strong",
        feedback:
          "The position is clear in both the introduction and conclusion. The reader can understand that the writer supports a flexible mixed arrangement.",
      },
      {
        label: "Idea development",
        status: "needs_work",
        feedback:
          "The main ideas are relevant, but some explanations remain general. The essay needs clearer cause-and-effect development to show why each point matters.",
      },
      {
        label: "Examples",
        status: "needs_work",
        feedback:
          "The examples support the argument, but they mostly describe broad situations. A more specific job, company, or workplace scenario would be more convincing.",
      },
      {
        label: "Paragraphing",
        status: "strong",
        feedback:
          "The body paragraphs have clear roles, with one paragraph focused on home working and another on office productivity.",
      },
      {
        label: "Task response",
        status: "needs_work",
        feedback:
          "The essay discusses both views and gives an opinion, but parts of the argument need fuller development before the response can be consistently stronger.",
      },
    ],
    detailedFeedback:
      "This essay has a clear overall structure and discusses the main advantages of working from home and working in an office. The opinion is easy to identify, and the paragraphs are logically arranged. The main limitation is depth of development: several sentences introduce reasonable ideas, but the explanation and examples remain quite general. The language communicates meaning clearly, although some collocations and complex sentence forms need more control.",
    grammarIssues: [
      {
        original: "When a team need to solve a problem quickly...",
        correction: "When a team needs to solve a problem quickly...",
        explanation:
          "The subject “a team” is singular here, so the verb should be “needs.”",
      },
      {
        original: "managers can see the progress more clearly",
        correction: "managers can monitor progress more clearly",
        explanation:
          "“Monitor progress” is a more natural academic collocation than “see the progress.”",
      },
      {
        original: "home working can make communication becomes slower",
        correction: "home working can make communication become slower",
        explanation:
          "After “make + object,” use the base verb form, so “become” is correct.",
      },
    ],
    vocabularyUpgrades: [
      {
        original: "good for workers",
        better: "beneficial for employees",
        explanation:
          "“Beneficial” is more precise and formal for an academic essay.",
      },
      {
        original: "spend less money on office space",
        better: "reduce office-related costs",
        explanation:
          "This option is more concise and suits the business context better.",
      },
      {
        original: "team spirit may become weaker",
        better: "team cohesion may decline",
        explanation:
          "“Team cohesion” is a more accurate phrase for workplace relationships.",
      },
    ],
    sentenceImprovements: [
      {
        original:
          "On the one hand, home working is good for workers because they can arrange their day in a flexible way.",
        improved:
          "On the one hand, working from home can be beneficial for employees because it allows them to organize their day more flexibly.",
        why: "The improved sentence uses a more natural phrase, avoids informal wording, and expresses the benefit more clearly.",
      },
      {
        original:
          "For example, a parent can start early, collect a child from school and finish tasks later.",
        improved:
          "For example, a parent in an administrative role may start early, collect a child from school, and complete routine tasks later in the evening.",
        why: "The revised example is more specific because it gives a type of worker and a clearer work situation.",
      },
      {
        original:
          "However, companies need clear rules, because without them home working can make communication becomes slower and some people may feel isolated.",
        improved:
          "However, companies need clear rules because, without them, working from home can make communication slower and leave some employees feeling isolated.",
        why: "The rewrite fixes the verb form, improves punctuation, and makes the final idea smoother.",
      },
    ],
    nextSteps: [
      "In the next essay, practise developing each body paragraph with more specific explanation.",
      "Include at least one concrete job, company, or everyday workplace situation for each main idea.",
      "Check subject-verb agreement, clause structure, and preposition use in complex sentences.",
      "Use the final two minutes to check whether all parts of the question have been addressed.",
    ],
    sampleAnswerNote:
      "A full report may include useful model expressions or sample content depending on the task.",
  },
  zh: {
    scoreSummary: [
      "文章完整回应了题目，并表达了较清楚的个人立场。",
      "段落结构基本清晰，但部分观点展开仍然偏泛。",
      "例子与主题相关，不过缺少更具体的情境或细节。",
      "词汇有一定变化，但仍有重复和搭配不够自然的问题。",
      "复杂句使用较多，但部分句子准确性不足。",
    ],
    taskSpecific: [
      {
        label: "立场 Position",
        status: "strong",
        feedback:
          "你的立场在开头和结尾都比较明确，读者能够理解你支持一种更灵活的混合工作安排。",
      },
      {
        label: "观点展开 Idea development",
        status: "needs_work",
        feedback:
          "主要观点与题目相关，但部分解释停留在较概括的层面，可以进一步说明为什么这些影响会发生。",
      },
      {
        label: "例子 Examples",
        status: "needs_work",
        feedback:
          "例子能够支持观点，但更像一般性描述。加入一个更具体的职业、公司或工作场景会更有说服力。",
      },
      {
        label: "段落结构 Paragraphing",
        status: "strong",
        feedback:
          "主体段分工清楚，一段讨论居家办公，一段讨论办公室工作的效率优势。",
      },
      {
        label: "任务回应 Task response",
        status: "needs_work",
        feedback:
          "文章讨论了双方观点并给出个人意见，但部分论证还需要更充分的发展才能稳定达到更高 Band。",
      },
    ],
    detailedFeedback:
      "这篇文章的整体结构比较清楚，能够讨论居家办公和办公室工作的主要优势，并给出个人立场。主要限制在于观点展开深度：一些句子提出了合理看法，但后面的解释和例子仍然偏概括。语言能够清楚传达意思，不过个别搭配和复杂句准确性仍需改善。",
    grammarIssues: [
      {
        original: "When a team need to solve a problem quickly...",
        correction: "When a team needs to solve a problem quickly...",
        explanation:
          "这里主语 “a team” 是单数，因此动词应使用 “needs”。",
      },
      {
        original: "managers can see the progress more clearly",
        correction: "managers can monitor progress more clearly",
        explanation:
          "“Monitor progress” 比 “see the progress” 更自然，也更适合学术写作语境。",
      },
      {
        original: "home working can make communication becomes slower",
        correction: "home working can make communication become slower",
        explanation:
          "“make + object” 后面应接动词原形，所以这里应使用 “become”。",
      },
    ],
    vocabularyUpgrades: [
      {
        original: "good for workers",
        better: "beneficial for employees",
        explanation:
          "“Beneficial” 更正式、更准确，适合 IELTS Writing 的议论文表达。",
      },
      {
        original: "spend less money on office space",
        better: "reduce office-related costs",
        explanation:
          "这个表达更简洁，也更贴合公司成本这一语境。",
      },
      {
        original: "team spirit may become weaker",
        better: "team cohesion may decline",
        explanation:
          "“Team cohesion” 更准确地表达团队协作和关系的稳定性。",
      },
    ],
    sentenceImprovements: [
      {
        original:
          "On the one hand, home working is good for workers because they can arrange their day in a flexible way.",
        improved:
          "On the one hand, working from home can be beneficial for employees because it allows them to organize their day more flexibly.",
        why: "修改后表达更自然，避免了偏口语的 “good”，同时更清楚地说明了好处。",
      },
      {
        original:
          "For example, a parent can start early, collect a child from school and finish tasks later.",
        improved:
          "For example, a parent in an administrative role may start early, collect a child from school, and complete routine tasks later in the evening.",
        why: "修改后加入了具体职业和工作情境，例子更有说服力。",
      },
      {
        original:
          "However, companies need clear rules, because without them home working can make communication becomes slower and some people may feel isolated.",
        improved:
          "However, companies need clear rules because, without them, working from home can make communication slower and leave some employees feeling isolated.",
        why: "修改后修正了动词形式，标点更自然，句子逻辑也更顺。",
      },
    ],
    nextSteps: [
      "下一篇作文优先练习把每个主体段的中心观点展开得更具体。",
      "每个主要观点至少加入一个具体职业、公司或生活场景作为例子。",
      "检查复杂句中的主谓一致、从句结构和介词搭配。",
      "写完后用两分钟检查是否完整讨论了题目的所有部分。",
    ],
    sampleAnswerNote:
      "正式反馈报告可能包含参考表达或示例内容，具体以练习结果为准。",
  },
};
