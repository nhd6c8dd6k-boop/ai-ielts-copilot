import { cache } from "react";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createOpenAIClient } from "@/lib/openai/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { countWords } from "@/lib/word-count";
import {
  getWritingVisualTypeLabel,
  normalizeWritingVisualData,
  type StructuredWritingVisualData,
} from "@/lib/writing-visual-data";

export type PublishedWritingTaskSummary = {
  id: string;
  taskType: 1 | 2;
  topic: string;
  title: string;
  promptSummary: string;
  visualType: StructuredWritingVisualData["type"] | null;
  visualTypeLabel: string | null;
  bandTarget: number | null;
  estimatedTimeMinutes: number;
  createdAt: string;
  completion: WritingCompletionSummary | null;
};

export type WritingCompletionSummary = {
  completed: true;
  lastBandLabel: string;
  lastPractisedAt: string;
};

export type PublishedWritingTask = PublishedWritingTaskSummary & {
  prompt: string;
  visualData: StructuredWritingVisualData | null;
  minimumWords: number;
  sampleAnswerBand7: string | null;
  sampleAnswerBand8: string | null;
};

export type WritingAttemptResult = {
  id: string;
  taskType: 1 | 2;
  topic: string;
  title: string;
  prompt: string;
  visualData: StructuredWritingVisualData | null;
  essay: string;
  wordCount: number;
  overallBand: number;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  feedback: string;
  grammarIssues: string[];
  vocabularyUpgrades: string[];
  sentenceImprovements: string[];
  nextSteps: string[];
  scoreSummary: string[];
  sampleAnswerBand7: string;
  sampleAnswerBand8: string;
  disclaimer: string;
  timeSpentSeconds: number;
  createdAt: string;
};

const writingFeedbackOutputSchema = z.object({
  overall_band: z.number().min(0).max(9),
  task_response: z.number().min(0).max(9),
  coherence_cohesion: z.number().min(0).max(9),
  lexical_resource: z.number().min(0).max(9),
  grammatical_range_accuracy: z.number().min(0).max(9),
  feedback: z.string().min(1),
  grammar_issues: z.array(z.string()).default([]),
  vocabulary_upgrades: z.array(z.string()).default([]),
  sentence_improvements: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  score_summary: z.array(z.string().min(1)).min(3).max(5),
  sample_answer_band_7: z.string().min(1),
  sample_answer_band_8: z.string().min(1),
  disclaimer: z.literal(
    "AI score is an estimate and does not represent an official IELTS score.",
  ),
});

type WritingFeedbackOutput = z.infer<typeof writingFeedbackOutputSchema>;

export const submitWritingPracticeSchema = z.object({
  writingTaskId: z.string().uuid(),
  essay: z.string().trim().min(1, "Essay is required."),
  language: z.enum(["zh", "en"]).default("en"),
  timeSpentSeconds: z.number().int().nonnegative().default(0),
});

type UsageSummary = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
};

export const getPublishedWritingTaskSummaries = cache(
  async (userId?: string | null) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("writing_tasks")
    .select("id,task_type,topic,prompt,visual_data,band_target,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const taskIds = (data ?? []).map((task) => task.id);
  const completionByTaskId = userId
    ? await getWritingCompletionByTaskId({ userId, taskIds })
    : new Map<string, WritingCompletionSummary>();

  return (data ?? []).map(
    (task): PublishedWritingTaskSummary => {
      const taskType = normalizeTaskType(task.task_type);
      const structuredVisualData = normalizeWritingVisualData(task.visual_data);

      return {
        id: task.id,
        taskType,
        topic: task.topic,
        title: buildWritingTaskTitle(task.task_type, task.topic),
        promptSummary: summarizePrompt(task.prompt),
        visualType: structuredVisualData?.type ?? null,
        visualTypeLabel: getWritingVisualTypeLabel({
          prompt: task.prompt,
          taskType,
          visualData: task.visual_data,
        }),
        bandTarget: task.band_target,
        estimatedTimeMinutes: getSuggestedTimeMinutes(task.task_type),
        createdAt: task.created_at,
        completion: completionByTaskId.get(task.id) ?? null,
      };
    },
  ).sort(sortIncompleteFirst);
  },
);

async function getWritingCompletionByTaskId({
  userId,
  taskIds,
}: {
  userId: string;
  taskIds: string[];
}) {
  if (!taskIds.length) {
    return new Map<string, WritingCompletionSummary>();
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("writing_attempts")
    .select("writing_task_id,overall_band,created_at")
    .eq("user_id", userId)
    .in("writing_task_id", taskIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const completionByTaskId = new Map<string, WritingCompletionSummary>();

  for (const attempt of data ?? []) {
    if (
      !attempt.writing_task_id ||
      completionByTaskId.has(attempt.writing_task_id)
    ) {
      continue;
    }

    completionByTaskId.set(attempt.writing_task_id, {
      completed: true,
      lastBandLabel: Number(attempt.overall_band).toFixed(1),
      lastPractisedAt: attempt.created_at,
    });
  }

  return completionByTaskId;
}

function sortIncompleteFirst(
  a: { completion: WritingCompletionSummary | null },
  b: { completion: WritingCompletionSummary | null },
) {
  return Number(Boolean(a.completion)) - Number(Boolean(b.completion));
}

export const getPublishedWritingTask = cache(async (id: string) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("writing_tasks")
    .select(
      "id,task_type,topic,prompt,visual_data,band_target,sample_answer_band_7,sample_answer_band_8,created_at",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const taskType = normalizeTaskType(data.task_type);
  const structuredVisualData = normalizeWritingVisualData(data.visual_data);

  return {
    id: data.id,
    taskType,
    topic: data.topic,
    title: buildWritingTaskTitle(taskType, data.topic),
    prompt: data.prompt,
    visualData: structuredVisualData,
    promptSummary: summarizePrompt(data.prompt),
    visualType: structuredVisualData?.type ?? null,
    visualTypeLabel: getWritingVisualTypeLabel({
      prompt: data.prompt,
      taskType,
      visualData: data.visual_data,
    }),
    bandTarget: data.band_target,
    estimatedTimeMinutes: getSuggestedTimeMinutes(taskType),
    minimumWords: getMinimumWords(taskType),
    sampleAnswerBand7: data.sample_answer_band_7,
    sampleAnswerBand8: data.sample_answer_band_8,
    completion: null,
    createdAt: data.created_at,
  } satisfies PublishedWritingTask;
});

export async function submitWritingPractice({
  userId,
  writingTaskId,
  essay,
  language,
  timeSpentSeconds,
}: {
  userId: string;
  writingTaskId: string;
  essay: string;
  language: "zh" | "en";
  timeSpentSeconds: number;
}) {
  const task = await getPublishedWritingTask(writingTaskId);

  if (!task) {
    throw new Error("Writing task not found or not published.");
  }

  const wordCount = countWords(essay);

  const { data: feedback, usage } = await gradeWritingWithOpenAI({
    task,
    essay,
    language,
    wordCount,
  });
  const admin = createSupabaseAdminClient();
  const { data: attempt, error } = await admin
    .from("writing_attempts")
    .insert({
      user_id: userId,
      writing_task_id: task.id,
      essay,
      word_count: wordCount,
      overall_band: feedback.overall_band,
      task_response: feedback.task_response,
      coherence_cohesion: feedback.coherence_cohesion,
      lexical_resource: feedback.lexical_resource,
      grammatical_range_accuracy: feedback.grammatical_range_accuracy,
      feedback_zh: feedback.feedback,
      feedback_en: feedback.feedback,
      grammar_issues: feedback.grammar_issues,
      vocabulary_upgrades: feedback.vocabulary_upgrades,
      sentence_improvements: feedback.sentence_improvements,
      next_steps: feedback.next_steps,
      sample_answer_band_7: feedback.sample_answer_band_7,
      sample_answer_band_8: feedback.sample_answer_band_8,
      raw_ai_output: feedback,
      model: usage.model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      total_tokens: usage.totalTokens,
      estimated_cost: usage.estimatedCost,
      time_spent_seconds: timeSpentSeconds,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await admin.from("practice_history").insert({
    id: attempt.id,
    user_id: userId,
    skill: "writing",
    content_type: "writing",
    content_id: task.id,
    set_type: "writing_task",
    set_id: task.id,
    title: task.title,
    score_label: `Band ${feedback.overall_band.toFixed(1)}`,
    score: feedback.overall_band,
    band_estimate: feedback.overall_band,
    accuracy: null,
    total_questions: 0,
    correct_count: 0,
    detail: `Task ${task.taskType} · ${task.topic} · ${wordCount} words`,
    weak_areas: buildWeakAreas(feedback),
    next_action: feedback.next_steps[0] ?? null,
    time_spent_seconds: timeSpentSeconds,
    answers: {
      writingAttemptId: attempt.id,
    },
  });

  await admin.from("ai_usage_logs").insert({
    admin_user_id: null,
    user_id: userId,
    usage_type: "writing_grade",
    content_type: "writing",
    target_type: "writing_attempt",
    target_id: attempt.id,
    model: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    estimated_cost: usage.estimatedCost,
  });

  return {
    attemptId: attempt.id,
    overallBand: feedback.overall_band,
    usage,
  };
}

export async function getWritingAttemptResult({
  attemptId,
  userId,
}: {
  attemptId: string;
  userId: string;
}): Promise<WritingAttemptResult | null> {
  const admin = createSupabaseAdminClient();
  const { data: attempt, error } = await admin
    .from("writing_attempts")
    .select(
      "id,user_id,writing_task_id,essay,word_count,overall_band,task_response,coherence_cohesion,lexical_resource,grammatical_range_accuracy,feedback_zh,feedback_en,grammar_issues,vocabulary_upgrades,sentence_improvements,next_steps,sample_answer_band_7,sample_answer_band_8,raw_ai_output,time_spent_seconds,created_at",
    )
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!attempt) {
    return null;
  }

  const { data: task, error: taskError } = await admin
    .from("writing_tasks")
    .select("id,task_type,topic,prompt,visual_data")
    .eq("id", attempt.writing_task_id)
    .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  const taskType = normalizeTaskType(task?.task_type ?? 2);

  return {
    id: attempt.id,
    taskType,
    topic: task?.topic ?? "Writing",
    title: buildWritingTaskTitle(taskType, task?.topic ?? "Writing"),
    prompt: task?.prompt ?? "",
    visualData: normalizeWritingVisualData(task?.visual_data),
    essay: attempt.essay,
    wordCount: attempt.word_count,
    overallBand: Number(attempt.overall_band),
    taskResponse: Number(attempt.task_response),
    coherenceCohesion: Number(attempt.coherence_cohesion),
    lexicalResource: Number(attempt.lexical_resource),
    grammaticalRangeAccuracy: Number(attempt.grammatical_range_accuracy),
    feedback: normalizeFeedbackText(
      attempt.raw_ai_output,
      attempt.feedback_zh,
      attempt.feedback_en,
    ),
    grammarIssues: normalizeStringArray(attempt.grammar_issues),
    vocabularyUpgrades: normalizeStringArray(attempt.vocabulary_upgrades),
    sentenceImprovements: normalizeStringArray(attempt.sentence_improvements),
    nextSteps: normalizeStringArray(attempt.next_steps),
    scoreSummary: normalizeScoreSummary(attempt.raw_ai_output),
    sampleAnswerBand7: attempt.sample_answer_band_7,
    sampleAnswerBand8: attempt.sample_answer_band_8,
    disclaimer:
      "AI score is an estimate and does not represent an official IELTS score.",
    timeSpentSeconds: attempt.time_spent_seconds,
    createdAt: attempt.created_at,
  } satisfies WritingAttemptResult;
}

export function getSuggestedTimeMinutes(taskType: number) {
  return normalizeTaskType(taskType) === 1 ? 20 : 40;
}

export function getMinimumWords(taskType: number) {
  return normalizeTaskType(taskType) === 1 ? 150 : 250;
}

async function gradeWritingWithOpenAI({
  task,
  essay,
  language,
  wordCount,
}: {
  task: PublishedWritingTask;
  essay: string;
  language: "zh" | "en";
  wordCount: number;
}) {
  const responseLanguageInstruction =
    language === "zh"
      ? "The learner's UI language is Simplified Chinese. Write feedback, score_summary, grammar_issues, vocabulary_upgrades, sentence_improvements, and next_steps in Simplified Chinese. IELTS terms such as Band, Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy, overview, and topic sentence may remain in English if useful, but explanations and advice must be Chinese. Do not provide a separate English version."
      : "The learner's UI language is English. Write feedback, score_summary, grammar_issues, vocabulary_upgrades, sentence_improvements, and next_steps in English. Do not provide a separate Chinese version.";
  const model = "gpt-5.2";
  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          "You are a strict IELTS Writing examiner. Estimate a non-official IELTS Writing band using IELTS public band descriptor principles.",
          "Be conservative. Do not reward fluent-looking but generic writing too highly. Penalize limited development, inaccurate grammar, repetitive vocabulary, weak cohesion, memorized-sounding phrases, unclear task response, and vague examples.",
          "Score exactly four criteria: Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.",
          "Band 8 is rare. Only assign 8.0 or above when the response fully addresses the task, has clear and well-developed ideas, strong cohesion, wide and precise vocabulary, mostly error-free grammar, flexible sentence structures, and few noticeable errors.",
          "Band 7 requires a clear position or overview, logical development, some less common vocabulary, good grammatical control, and errors that do not reduce clarity.",
          "Band 6 is appropriate when the task is addressed but development is uneven, ideas are relevant but general, cohesion is mechanical or sometimes unclear, vocabulary is adequate but repetitive, and grammar has noticeable errors despite attempted complex sentences.",
          "If the response sounds polished but lacks specific development, examples, data comparison, or clear analysis, do not assign a high band.",
          "For Task 1, require a clear overview, accurate main trends/features, and key data comparisons. If there is no overview, Task Achievement is usually no higher than 6.0. Do not reward simple listing of data as a high band.",
          "For Task 2, require a clear answer to the question, a clear position, sufficiently developed arguments, specific examples, and no major drift from the prompt.",
          "If the essay is under the minimum word count, explicitly mention it and cap the score conservatively. Task Achievement / Task Response must be affected.",
          "Feedback should explain why the essay is not the next higher band and include one or two specific examples from the essay when possible.",
          "Return score_summary as 3 to 5 concise strings. Each item must be specific, score-limiting, and aligned with the criteria scores. Include one clear next focus. If the response is underlength, mention underlength in score_summary. If Task 1 lacks an overview, mention that. If Task 2 has vague opinions or generic examples, mention that. Do not use praise such as excellent unless the score genuinely supports it.",
          responseLanguageInstruction,
          "Return strict JSON only. The task prompt and essay are in English, but feedback content must follow the requested UI language.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          task_type: task.taskType,
          topic: task.topic,
          prompt: task.prompt,
          visual_data: task.visualData,
          band_target: task.bandTarget,
          response_language: language,
          word_count: wordCount,
          minimum_words: getMinimumWords(task.taskType),
          essay,
          requirements: [
            "Do not claim this is an official IELTS score.",
            "Use 0.5 band increments for all scores.",
            "Be stricter than a general writing coach. Do not inflate scores to encourage the learner.",
            "Identify practical grammar and vocabulary improvements.",
            "Explain the main score-limiting issues clearly.",
            language === "zh"
              ? "Return only Simplified Chinese feedback content. Do not include a full English feedback version."
              : "Return only English feedback content. Do not include a full Chinese feedback version.",
            "Return score_summary with 3 to 5 short bullet-style strings. Focus on why this band was assigned, the biggest deduction, the gap to the next band, and the next priority.",
            "Provide Band 7 and Band 8 sample answers in English.",
          ],
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "writing_feedback_v1",
        schema: writingFeedbackOutputSchema.toJSONSchema(),
        strict: true,
      },
    },
  });
  const usage = extractUsage(model, response);

  try {
    const parsedFeedback = writingFeedbackOutputSchema.parse(
      JSON.parse(response.output_text),
    );

    return {
      data: applyConservativeWritingScore(parsedFeedback, {
        language,
        taskType: task.taskType,
        wordCount,
      }),
      usage,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `OpenAI returned invalid writing feedback JSON: ${error.message}`
        : "OpenAI returned invalid writing feedback JSON.",
    );
  }
}

function applyConservativeWritingScore(
  feedback: WritingFeedbackOutput,
  {
    language,
    taskType,
    wordCount,
  }: {
    language: "zh" | "en";
    taskType: 1 | 2;
    wordCount: number;
  },
): WritingFeedbackOutput {
  const minimumWords = getMinimumWords(taskType);
  const underlengthCap = getUnderlengthCap(wordCount, minimumWords);
  const taskResponse = normalizeCriterionBand(
    underlengthCap == null
      ? feedback.task_response
      : Math.min(feedback.task_response, underlengthCap),
  );
  const coherenceCohesion = normalizeCriterionBand(feedback.coherence_cohesion);
  const lexicalResource = normalizeCriterionBand(feedback.lexical_resource);
  const grammaticalRangeAccuracy = normalizeCriterionBand(
    feedback.grammatical_range_accuracy,
  );
  const criteria = [
    taskResponse,
    coherenceCohesion,
    lexicalResource,
    grammaticalRangeAccuracy,
  ];
  const rawAverage =
    criteria.reduce((total, criterion) => total + criterion, 0) /
    criteria.length;
  const minimumCriterion = Math.min(...criteria);
  let overallBand = roundToNearestHalf(rawAverage);

  overallBand = Math.min(overallBand, minimumCriterion + 1);

  if (
    overallBand >= 8 &&
    (criteria.some((criterion) => criterion < 7.5) ||
      criteria.filter((criterion) => criterion >= 8).length < 3)
  ) {
    overallBand = 7.5;
  }

  if (underlengthCap != null) {
    overallBand = Math.min(overallBand, underlengthCap);
  }

  overallBand = normalizeCriterionBand(overallBand);
  const scoreSummary =
    underlengthCap == null
      ? feedback.score_summary
      : ensureUnderlengthScoreSummary(feedback.score_summary, {
          language,
          taskType,
          minimumWords,
        });
  const nextSteps =
    language === "zh"
      ? ensureChineseNextSteps(feedback.next_steps, {
          isUnderlength: underlengthCap != null,
        })
      : feedback.next_steps;

  return {
    ...feedback,
    overall_band: overallBand,
    task_response: taskResponse,
    coherence_cohesion: coherenceCohesion,
    lexical_resource: lexicalResource,
    grammatical_range_accuracy: grammaticalRangeAccuracy,
    score_summary: scoreSummary,
    next_steps: nextSteps,
    feedback:
      underlengthCap == null
        ? feedback.feedback
        : appendUnderlengthNote(
            feedback.feedback,
            language === "zh"
              ? `字数低于 Task ${taskType} 的最低要求（${minimumWords} 词），Task Achievement / Task Response 和 overall band 已被保守限制。`
              : `The response is under the Task ${taskType} minimum of ${minimumWords} words, so Task Achievement / Task Response and the overall band have been capped conservatively.`,
          ),
  };
}

function getUnderlengthCap(wordCount: number, minimumWords: number) {
  if (wordCount >= minimumWords) {
    return null;
  }

  const ratio = wordCount / minimumWords;

  if (ratio < 0.7) {
    return 5;
  }

  if (ratio < 0.9) {
    return 5.5;
  }

  return 6;
}

function appendUnderlengthNote(feedback: string, note: string) {
  return feedback.toLowerCase().includes("under")
    ? feedback
    : `${feedback}\n\n${note}`;
}

function ensureUnderlengthScoreSummary(
  scoreSummary: string[],
  {
    language,
    taskType,
    minimumWords,
  }: {
    language: "zh" | "en";
    taskType: 1 | 2;
    minimumWords: number;
  },
) {
  const alreadyMentionsUnderlength = scoreSummary.some((item) =>
    /underlength|under the.*minimum|word count|minimum words|字数|低于/i.test(
      item,
    ),
  );

  if (alreadyMentionsUnderlength) {
    return scoreSummary.slice(0, 5);
  }

  return [
    language === "zh"
      ? `字数低于 Task ${taskType} 的最低要求（${minimumWords} 词），这会明显限制 Task Achievement / Task Response 和总 Band。`
      : `The response is under the Task ${taskType} minimum of ${minimumWords} words, which clearly limits Task Achievement / Task Response and the overall band.`,
    ...scoreSummary,
  ].slice(0, 5);
}

function ensureChineseNextSteps(
  nextSteps: string[],
  { isUnderlength }: { isUnderlength: boolean },
) {
  if (
    nextSteps.length &&
    nextSteps.every((step) => containsChineseText(step) || !looksMostlyEnglish(step))
  ) {
    return nextSteps;
  }

  if (isUnderlength) {
    return [
      "这篇作文低于最低字数要求，下一次先确保达到字数要求。",
      "主体段需要加入更具体的解释、例子或数据比较。",
      "提交前检查是否完整回应题目要求，并保留足够时间检查语法和拼写。",
    ];
  }

  return [
    "下一篇作文先重点解决最影响分数的一个问题，不要同时改太多方面。",
    "针对 Task Response / Task Achievement，练习更具体地展开观点、例子或数据比较。",
    "针对 Coherence and Cohesion，注意段落之间的逻辑连接，避免只用机械连接词。",
    "针对 Lexical Resource 和 Grammar，减少重复表达，并检查复杂句准确性。",
  ];
}

function containsChineseText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function looksMostlyEnglish(value: string) {
  const letters = value.match(/[A-Za-z]/g)?.length ?? 0;
  const chinese = value.match(/[\u3400-\u9fff]/g)?.length ?? 0;

  return letters > 20 && letters > chinese * 2;
}

function normalizeCriterionBand(score: number) {
  return Math.min(9, Math.max(0, roundToNearestHalf(score)));
}

function roundToNearestHalf(score: number) {
  return Math.round(score * 2) / 2;
}

function buildWritingTaskTitle(taskType: number, topic: string) {
  return `Task ${normalizeTaskType(taskType)}: ${topic}`;
}

function summarizePrompt(prompt: string) {
  return prompt.length > 180 ? `${prompt.slice(0, 177)}...` : prompt;
}

function normalizeTaskType(taskType: number): 1 | 2 {
  return taskType === 1 ? 1 : 2;
}

function buildWeakAreas(feedback: z.infer<typeof writingFeedbackOutputSchema>) {
  const criteria = [
    ["Task Response", feedback.task_response],
    ["Coherence and Cohesion", feedback.coherence_cohesion],
    ["Lexical Resource", feedback.lexical_resource],
    ["Grammar", feedback.grammatical_range_accuracy],
  ] as const;

  return criteria
    .filter(([, score]) => score < feedback.overall_band)
    .map(([label]) => label)
    .slice(0, 3);
}

function extractUsage(model: string, response: unknown): UsageSummary {
  const usage = (response as { usage?: Record<string, number | undefined> }).usage;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens;

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost: estimateCost(inputTokens, outputTokens),
  };
}

function estimateCost(inputTokens: number, outputTokens: number) {
  const inputCostPerMillion = 1.25;
  const outputCostPerMillion = 10;

  return Number(
    (
      (inputTokens / 1_000_000) * inputCostPerMillion +
      (outputTokens / 1_000_000) * outputCostPerMillion
    ).toFixed(6),
  );
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeScoreSummary(rawAiOutput: unknown) {
  if (
    !rawAiOutput ||
    typeof rawAiOutput !== "object" ||
    !("score_summary" in rawAiOutput)
  ) {
    return [];
  }

  return normalizeStringArray(
    (rawAiOutput as { score_summary?: unknown }).score_summary,
  ).slice(0, 5);
}

function normalizeFeedbackText(
  rawAiOutput: unknown,
  feedbackZh: string,
  feedbackEn: string,
) {
  if (
    rawAiOutput &&
    typeof rawAiOutput === "object" &&
    "feedback" in rawAiOutput &&
    typeof (rawAiOutput as { feedback?: unknown }).feedback === "string"
  ) {
    return (rawAiOutput as { feedback: string }).feedback;
  }

  return feedbackZh || feedbackEn;
}
