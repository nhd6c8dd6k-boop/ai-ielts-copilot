import { cache } from "react";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createOpenAIClient } from "@/lib/openai/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  feedbackZh: string;
  feedbackEn: string;
  grammarIssues: string[];
  vocabularyUpgrades: string[];
  sentenceImprovements: string[];
  nextSteps: string[];
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
  feedback_zh: z.string().min(1),
  feedback_en: z.string().min(1),
  grammar_issues: z.array(z.string()).default([]),
  vocabulary_upgrades: z.array(z.string()).default([]),
  sentence_improvements: z.array(z.string()).default([]),
  next_steps: z.array(z.string()).default([]),
  sample_answer_band_7: z.string().min(1),
  sample_answer_band_8: z.string().min(1),
  disclaimer: z.literal(
    "AI score is an estimate and does not represent an official IELTS score.",
  ),
});

export const submitWritingPracticeSchema = z.object({
  writingTaskId: z.string().uuid(),
  essay: z.string().trim().min(1, "Essay is required."),
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
    (task): PublishedWritingTaskSummary => ({
      id: task.id,
      taskType: normalizeTaskType(task.task_type),
      topic: task.topic,
      title: buildWritingTaskTitle(task.task_type, task.topic),
      promptSummary: summarizePrompt(task.prompt),
      visualTypeLabel: getWritingVisualTypeLabel({
        prompt: task.prompt,
        taskType: normalizeTaskType(task.task_type),
        visualData: task.visual_data,
      }),
      bandTarget: task.band_target,
      estimatedTimeMinutes: getSuggestedTimeMinutes(task.task_type),
      createdAt: task.created_at,
      completion: completionByTaskId.get(task.id) ?? null,
    }),
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

  return {
    id: data.id,
    taskType,
    topic: data.topic,
    title: buildWritingTaskTitle(taskType, data.topic),
    prompt: data.prompt,
    visualData: normalizeWritingVisualData(data.visual_data),
    promptSummary: summarizePrompt(data.prompt),
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
  timeSpentSeconds,
}: {
  userId: string;
  writingTaskId: string;
  essay: string;
  timeSpentSeconds: number;
}) {
  const task = await getPublishedWritingTask(writingTaskId);

  if (!task) {
    throw new Error("Writing task not found or not published.");
  }

  const wordCount = countWords(essay);
  const minimumWords = getMinimumWords(task.taskType);

  if (wordCount < minimumWords) {
    throw new Error(
      `Please write at least ${minimumWords} words for Task ${task.taskType}.`,
    );
  }

  const { data: feedback, usage } = await gradeWritingWithOpenAI({
    task,
    essay,
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
      feedback_zh: feedback.feedback_zh,
      feedback_en: feedback.feedback_en,
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
      "id,user_id,writing_task_id,essay,word_count,overall_band,task_response,coherence_cohesion,lexical_resource,grammatical_range_accuracy,feedback_zh,feedback_en,grammar_issues,vocabulary_upgrades,sentence_improvements,next_steps,sample_answer_band_7,sample_answer_band_8,time_spent_seconds,created_at",
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
    feedbackZh: attempt.feedback_zh,
    feedbackEn: attempt.feedback_en,
    grammarIssues: normalizeStringArray(attempt.grammar_issues),
    vocabularyUpgrades: normalizeStringArray(attempt.vocabulary_upgrades),
    sentenceImprovements: normalizeStringArray(attempt.sentence_improvements),
    nextSteps: normalizeStringArray(attempt.next_steps),
    sampleAnswerBand7: attempt.sample_answer_band_7,
    sampleAnswerBand8: attempt.sample_answer_band_8,
    disclaimer:
      "AI score is an estimate and does not represent an official IELTS score.",
    timeSpentSeconds: attempt.time_spent_seconds,
    createdAt: attempt.created_at,
  } satisfies WritingAttemptResult;
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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
  wordCount,
}: {
  task: PublishedWritingTask;
  essay: string;
  wordCount: number;
}) {
  const model = "gpt-5.2";
  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are an IELTS Writing examiner and coach. Estimate a non-official IELTS Writing band using Task Response or Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Return strict JSON only. Feedback should be useful for Chinese IELTS learners. The task prompt and essay are in English; feedback_zh must be Chinese and feedback_en must be English.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task_type: task.taskType,
          topic: task.topic,
          prompt: task.prompt,
          visual_data: task.visualData,
          band_target: task.bandTarget,
          word_count: wordCount,
          essay,
          requirements: [
            "Do not claim this is an official IELTS score.",
            "Identify practical grammar and vocabulary improvements.",
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
    return {
      data: writingFeedbackOutputSchema.parse(JSON.parse(response.output_text)),
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
