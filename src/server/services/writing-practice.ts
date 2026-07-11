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
import {
  calibrateWritingScores,
  getMinimumWordsForWritingTask,
} from "@/server/services/writing-scoring";

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
  sentenceImprovements: WritingSentenceImprovement[];
  taskSpecificFeedback: WritingTaskSpecificFeedback | null;
  nextSteps: string[];
  scoreSummary: string[];
  sampleAnswerBand7: string;
  sampleAnswerBand8: string;
  disclaimer: string;
  timeSpentSeconds: number;
  createdAt: string;
};

export type WritingSentenceImprovement = {
  original: string;
  improved: string;
  explanation: string;
};

export type WritingTaskSpecificFeedback = {
  taskType: "task1" | "task2";
  items: WritingTaskSpecificFeedbackItem[];
};

export type WritingTaskSpecificFeedbackItem = {
  label: string;
  status: "strong" | "needs_work" | "missing";
  feedback: string;
};

const sentenceImprovementOutputSchema = z.object({
  original: z.string().min(1),
  improved: z.string().min(1),
  explanation: z.string().min(1),
});

const taskSpecificFeedbackOutputSchema = z.object({
  task_type: z.enum(["task1", "task2"]),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        status: z.enum(["strong", "needs_work", "missing"]),
        feedback: z.string().min(1),
      }),
    )
    .min(4)
    .max(5),
});

const writingFeedbackOutputSchema = z.object({
  task_response: z.number().min(0).max(9),
  coherence_cohesion: z.number().min(0).max(9),
  lexical_resource: z.number().min(0).max(9),
  grammatical_range_accuracy: z.number().min(0).max(9),
  feedback: z.string().min(1),
  grammar_issues: z.array(z.string()).default([]),
  vocabulary_upgrades: z.array(z.string()).default([]),
  sentence_improvements: z.array(sentenceImprovementOutputSchema).min(1).max(4),
  task_specific_feedback: taskSpecificFeedbackOutputSchema,
  next_steps: z.array(z.string()).default([]),
  score_summary: z.array(z.string().min(1)).min(3).max(5),
  sample_answer_band_7: z.string().min(1),
  sample_answer_band_8: z.string().min(1),
  disclaimer: z.literal(
    "AI score is an estimate and does not represent an official IELTS score.",
  ),
});

type WritingFeedbackOutput = z.infer<typeof writingFeedbackOutputSchema>;
type CalibratedWritingFeedbackOutput = WritingFeedbackOutput & {
  overall_band: number;
  calibration_notes: string[];
};

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
      sentence_improvements: feedback.sentence_improvements.map(
        formatSentenceImprovementForStorage,
      ),
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
    sentenceImprovements: normalizeSentenceImprovements(
      attempt.raw_ai_output,
      attempt.sentence_improvements,
    ),
    taskSpecificFeedback: normalizeTaskSpecificFeedback(
      attempt.raw_ai_output,
    ),
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
  return getMinimumWordsForWritingTask(normalizeTaskType(taskType));
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
      ? "The learner's UI language is Simplified Chinese. Write feedback, score_summary, grammar_issues, vocabulary_upgrades, sentence_improvements.explanation, task_specific_feedback.feedback, and next_steps in Simplified Chinese. IELTS terms such as Band, Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy, overview, and topic sentence may remain in English if useful, but explanations and advice must be Chinese. sentence_improvements.original and sentence_improvements.improved may be English because they quote or rewrite the learner's essay. Do not provide a separate English version."
      : "The learner's UI language is English. Write all feedback content in English only. Do not write Chinese explanations. Do not include Simplified Chinese. Do not provide bilingual feedback. feedback, score_summary, grammar_issues, vocabulary_upgrades, sentence_improvements.explanation, task_specific_feedback.feedback, and next_steps must all be in English.";
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
          "Score exactly four criteria independently: Task Achievement for Task 1 or Task Response for Task 2, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Do not let an overall impression pull all criteria upward together.",
          "Do not decide the final overall band. The server calculates overall_band from the four criteria. Return only the four criterion scores and feedback fields.",
          "Before assigning each criterion score, identify concrete evidence from the essay and decide why the criterion is not the next higher band. If evidence for a higher band is insufficient, choose the lower band.",
          "Use only 0.5 band increments for each criterion score.",
          "Band 8 is rare. Only assign 8.0 or above when the response fully addresses the task, has clear and well-developed ideas, strong cohesion, wide and precise vocabulary, mostly error-free grammar, flexible sentence structures, and few noticeable errors.",
          "Band 7 requires a clear position or overview, logical development, some less common vocabulary, good grammatical control, and errors that do not reduce clarity.",
          "Band 6.5 or 7.0 requires solid evidence in the relevant criterion. Do not give 6.5+ for Task Achievement / Task Response when ideas are only stated briefly, examples are generic, data comparison is weak, or the answer only partially addresses the task.",
          "Band 6 is appropriate when the task is addressed but development is uneven, ideas are relevant but general, cohesion is mechanical or sometimes unclear, vocabulary is adequate but repetitive, and grammar has noticeable errors despite attempted complex sentences.",
          "If the response sounds polished but lacks specific development, examples, data comparison, or clear analysis, do not assign a high band.",
          "For Task 1, use Task Achievement. Require a clear overview, selected key features, accurate data description, meaningful comparisons, and objective reporting. If there is no overview, Task Achievement is usually no higher than 5.5. If the answer simply lists data, has weak comparison, inaccurate figures, subjective opinions, or invented information, cap Task Achievement conservatively.",
          "For Task 2, use Task Response. Require a clear answer to the exact question, a clear position where required, sufficiently developed arguments, specific examples, balanced coverage for discuss-both-views questions, and no major drift from the prompt. If an agree/disagree essay does not clearly answer the question, or a discuss-both-views essay discusses only one side, Task Response must be clearly limited.",
          "Lexical Resource must be judged by accuracy, collocation, repetition, spelling, word form, and precision. A few advanced words do not justify Band 7 if they are misused or surrounded by repetitive basic vocabulary.",
          "Grammatical Range and Accuracy must consider simple sentence control, complex sentence control, error density, subject-verb agreement, articles, tense, singular/plural forms, fragments, and comma splices. Do not reward complex sentence attempts if they frequently break accuracy.",
          "Coherence and Cohesion must consider paragraph logic, sequencing, referencing, linking, and repetition. Mechanical use of Firstly, Secondly, or Moreover does not justify a high score if progression is weak.",
          "If the essay is under the minimum word count, explicitly mention it and cap the score conservatively. Task Achievement / Task Response must be affected.",
          "Feedback should explain why the essay is not the next higher band and include one or two specific examples from the essay when possible.",
          "Return score_summary as 3 to 5 concise strings. Each item must be specific, score-limiting, and aligned with the criteria scores. Include one clear next focus. If the response is underlength, mention underlength in score_summary. If Task 1 lacks an overview, mention that. If Task 2 has vague opinions or generic examples, mention that. Do not use praise such as excellent unless the score genuinely supports it.",
          "Return sentence_improvements as 2 to 4 objects with original, improved, and explanation. original must be a real sentence or clear phrase from the learner's essay. Do not invent sentences the learner did not write. improved must be a more natural, accurate, higher-band version. explanation must explain the specific language or development improvement in the requested UI language. If the essay is very short, still provide at least one phrase-level improvement.",
          "Return task_specific_feedback with task_type set to task1 for Task 1 and task2 for Task 2. For Task 1, only assess Overview, Key features, Data comparison, Accuracy, and Objective reporting. For Task 2, only assess Position, Idea development, Examples, Paragraphing, and Task response. Each item must use status strong, needs_work, or missing, and feedback must be specific and consistent with the score. Low-scoring essays should not receive many strong statuses.",
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
            "Use 0.5 band increments for the four criterion scores.",
            "Do not return or infer an overall band; the server computes it from the four criterion scores.",
            "Be stricter than a general writing coach. Do not inflate scores to encourage the learner.",
            "Identify practical grammar and vocabulary improvements.",
            "Explain the main score-limiting issues clearly.",
            language === "zh"
              ? "Return only Simplified Chinese feedback content. Do not include a full English feedback version."
              : "Return only English feedback content. Do not include Chinese characters, Chinese explanations, or a full Chinese feedback version.",
            "Return score_summary with 3 to 5 short bullet-style strings. Focus on why this band was assigned, the biggest deduction, the gap to the next band, and the next priority.",
            "Return sentence_improvements as structured objects: original, improved, explanation. original must quote or closely match the learner's essay.",
            task.taskType === 1
              ? "Return task_specific_feedback for Task 1 only: Overview, Key features, Data comparison, Accuracy, Objective reporting. Do not include Task 2 position/example logic."
              : "Return task_specific_feedback for Task 2 only: Position, Idea development, Examples, Paragraphing, Task response. Do not include Task 1 overview/data comparison logic.",
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
        essay,
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
    essay,
    language,
    taskType,
    wordCount,
  }: {
    essay: string;
    language: "zh" | "en";
    taskType: 1 | 2;
    wordCount: number;
  },
): CalibratedWritingFeedbackOutput {
  const minimumWords = getMinimumWords(taskType);
  const isUnderlength = wordCount < minimumWords;
  const calibratedScores = calibrateWritingScores({
    criteria: {
      taskResponse: feedback.task_response,
      coherenceCohesion: feedback.coherence_cohesion,
      lexicalResource: feedback.lexical_resource,
      grammaticalRangeAccuracy: feedback.grammatical_range_accuracy,
    },
    taskSpecificFeedback: feedback.task_specific_feedback,
    taskType,
    wordCount,
  });
  const scoreSummary =
    !isUnderlength
      ? feedback.score_summary
      : ensureUnderlengthScoreSummary(feedback.score_summary, {
          language,
          taskType,
          minimumWords,
        });
  const sanitizedFeedback = sanitizeFeedbackLanguage(
    {
      ...feedback,
      score_summary: scoreSummary,
    },
    {
      isUnderlength,
      essay,
      language,
    },
  );

  return {
    ...sanitizedFeedback,
    overall_band: calibratedScores.overallBand,
    task_response: calibratedScores.taskResponse,
    coherence_cohesion: calibratedScores.coherenceCohesion,
    lexical_resource: calibratedScores.lexicalResource,
    grammatical_range_accuracy: calibratedScores.grammaticalRangeAccuracy,
    calibration_notes: calibratedScores.appliedCaps,
    feedback:
      !isUnderlength
        ? sanitizedFeedback.feedback
        : appendUnderlengthNote(
            sanitizedFeedback.feedback,
            language === "zh"
              ? `字数低于 Task ${taskType} 的最低要求（${minimumWords} 词），Task Achievement / Task Response 和 overall band 已被保守限制。`
              : `The response is under the Task ${taskType} minimum of ${minimumWords} words, so Task Achievement / Task Response and the overall band have been capped conservatively.`,
          ),
  };
}

function appendUnderlengthNote(feedback: string, note: string) {
  return feedback.toLowerCase().includes("under")
    ? feedback
    : `${feedback}\n\n${note}`;
}

function sanitizeFeedbackLanguage(
  feedback: WritingFeedbackOutput,
  {
    essay,
    isUnderlength,
    language,
  }: {
    essay: string;
    isUnderlength: boolean;
    language: "zh" | "en";
  },
): WritingFeedbackOutput {
  if (language === "en") {
    return {
      ...feedback,
      feedback: containsChineseText(feedback.feedback)
        ? ENGLISH_FEEDBACK_FALLBACK
        : feedback.feedback,
      grammar_issues: containsChineseText(feedback.grammar_issues.join(" "))
        ? ENGLISH_GRAMMAR_ISSUES_FALLBACK
        : feedback.grammar_issues,
      vocabulary_upgrades: containsChineseText(
        feedback.vocabulary_upgrades.join(" "),
      )
        ? ENGLISH_VOCABULARY_UPGRADES_FALLBACK
        : feedback.vocabulary_upgrades,
      sentence_improvements: feedback.sentence_improvements.some((item) =>
        containsChineseText(`${item.improved} ${item.explanation}`),
      )
        ? getSentenceImprovementFallback({ essay, language: "en" })
        : feedback.sentence_improvements,
      task_specific_feedback: sanitizeEnglishTaskSpecificFeedback(
        feedback.task_specific_feedback,
      ),
      next_steps: containsChineseText(feedback.next_steps.join(" "))
        ? getEnglishNextStepsFallback(isUnderlength)
        : feedback.next_steps,
      score_summary: containsChineseText(feedback.score_summary.join(" "))
        ? getEnglishScoreSummaryFallback(isUnderlength)
        : feedback.score_summary,
    };
  }

  return {
    ...feedback,
    feedback: looksMostlyEnglish(feedback.feedback)
      ? CHINESE_FEEDBACK_FALLBACK
      : feedback.feedback,
    grammar_issues: feedback.grammar_issues.every(
      (item) => containsChineseText(item) || !looksMostlyEnglish(item),
    )
      ? feedback.grammar_issues
      : CHINESE_GRAMMAR_ISSUES_FALLBACK,
    vocabulary_upgrades: feedback.vocabulary_upgrades.every(
      (item) => containsChineseText(item) || !looksMostlyEnglish(item),
    )
      ? feedback.vocabulary_upgrades
      : CHINESE_VOCABULARY_UPGRADES_FALLBACK,
    sentence_improvements: feedback.sentence_improvements.every((item) =>
      containsChineseText(item.explanation),
    )
      ? feedback.sentence_improvements
      : getSentenceImprovementFallback({ essay, language: "zh" }),
    task_specific_feedback: sanitizeChineseTaskSpecificFeedback(
      feedback.task_specific_feedback,
    ),
    next_steps: ensureChineseNextSteps(feedback.next_steps, {
      isUnderlength,
    }),
    score_summary: feedback.score_summary.every(
      (item) => containsChineseText(item) || !looksMostlyEnglish(item),
    )
      ? feedback.score_summary
      : getChineseScoreSummaryFallback(isUnderlength),
  };
}

const ENGLISH_FEEDBACK_FALLBACK =
  "The response addresses the task to some extent, but the development, language control, and clarity need improvement before it can reach a higher band.";

const ENGLISH_GRAMMAR_ISSUES_FALLBACK = [
  "Review sentence structure and verb forms for accuracy.",
  "Use complex sentences carefully so that meaning stays clear.",
  "Check articles, plurals, and subject-verb agreement before submitting.",
];

const ENGLISH_VOCABULARY_UPGRADES_FALLBACK = [
  "Replace repeated general words with more precise task-related vocabulary.",
  "Use academic collocations naturally instead of memorized phrases.",
  "Choose words that clearly match the argument, data, or example.",
];

const CHINESE_FEEDBACK_FALLBACK =
  "这篇作文在一定程度上回应了题目，但观点展开、语言准确性和表达清晰度还需要提升，才能达到更高 Band。";

const CHINESE_GRAMMAR_ISSUES_FALLBACK = [
  "检查句子结构和动词形式，避免影响意思清晰度。",
  "使用复杂句时先保证准确，再追求句型变化。",
  "提交前重点检查冠词、复数和主谓一致。",
];

const CHINESE_VOCABULARY_UPGRADES_FALLBACK = [
  "减少重复的泛泛表达，换成更贴合题目的词汇。",
  "自然使用学术搭配，不要堆砌背诵短语。",
  "选择能准确表达论点、数据或例子的词。",
];

function getEnglishScoreSummaryFallback(isUnderlength: boolean) {
  if (isUnderlength) {
    return [
      "The response is significantly under the minimum word requirement, which limits Task Response.",
      "Ideas are not developed enough to support a higher band.",
      "The next priority is to write a complete response with enough explanation and examples.",
    ];
  }

  return [
    "The response addresses the task only to a limited extent.",
    "The main score limit is underdeveloped ideas and examples.",
    "Cohesion needs to feel more logical, not just dependent on simple linking words.",
    "The next priority is to develop each body paragraph with clearer support.",
  ];
}

function getChineseScoreSummaryFallback(isUnderlength: boolean) {
  if (isUnderlength) {
    return [
      "这篇作文低于最低字数要求，明显限制了 Task Response / Task Achievement。",
      "观点和例子展开不足，因此很难支撑更高 Band。",
      "下一篇的优先任务是先写完整，再提升语言质量。",
    ];
  }

  return [
    "这篇作文回应了题目的一部分，但展开还不够充分。",
    "主要扣分点是观点、例子或数据比较不够具体。",
    "段落衔接需要更自然，不要只依赖机械连接词。",
    "下一篇优先练习把每个主体段写得更完整。",
  ];
}

function getEnglishNextStepsFallback(isUnderlength: boolean) {
  if (isUnderlength) {
    return [
      "Make sure your response reaches the minimum word requirement before submitting.",
      "Develop each body paragraph with clearer explanation and more specific examples.",
      "Review grammar accuracy, especially sentence structure and verb forms.",
      "Use more precise vocabulary and avoid repeating general expressions.",
    ];
  }

  return [
    "Focus on the single issue that most limits your score in the next essay.",
    "Develop Task Response / Task Achievement with clearer explanation, examples, or data comparison.",
    "Improve Coherence and Cohesion by making paragraph logic clearer.",
    "Reduce repeated vocabulary and check the accuracy of complex sentences.",
  ];
}

function getSentenceImprovementFallback({
  essay,
  language,
}: {
  essay: string;
  language: "zh" | "en";
}): WritingFeedbackOutput["sentence_improvements"] {
  const original = extractRewriteSource(essay);
  const improved =
    original.length > 20
      ? `${original.replace(/\s+/g, " ").trim()} This idea should be developed with a clearer reason or example.`
      : "This idea should be developed with a clearer reason or example.";

  return [
    {
      original,
      improved,
      explanation:
        language === "zh"
          ? "这条改写基于你的原文片段。原句需要加入更清楚的原因或例子，才能支撑更高 Band 的 Task Response / Task Achievement。"
          : "This rewrite is based on your original wording. The idea needs a clearer reason or example to support a higher band for Task Response / Task Achievement.",
    },
  ];
}

function extractRewriteSource(essay: string) {
  const trimmed = essay.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "The response does not contain enough text for a full sentence rewrite.";
  }

  const firstSentence = trimmed.match(/[^.!?]+[.!?]/)?.[0]?.trim();

  if (firstSentence) {
    return firstSentence;
  }

  return trimmed.slice(0, 160);
}

function sanitizeEnglishTaskSpecificFeedback(
  feedback: WritingFeedbackOutput["task_specific_feedback"],
) {
  if (
    feedback.items.some((item) =>
      containsChineseText(`${item.label} ${item.feedback}`),
    )
  ) {
    return getEnglishTaskSpecificFallback(feedback.task_type);
  }

  return feedback;
}

function sanitizeChineseTaskSpecificFeedback(
  feedback: WritingFeedbackOutput["task_specific_feedback"],
) {
  if (feedback.items.every((item) => containsChineseText(item.feedback))) {
    return feedback;
  }

  return getChineseTaskSpecificFallback(feedback.task_type);
}

function getEnglishTaskSpecificFallback(
  taskType: WritingFeedbackOutput["task_specific_feedback"]["task_type"],
): WritingFeedbackOutput["task_specific_feedback"] {
  if (taskType === "task1") {
    return {
      task_type: "task1",
      items: [
        {
          label: "Overview",
          status: "needs_work",
          feedback:
            "The answer needs a clearer overview that summarises the main trend or overall pattern.",
        },
        {
          label: "Key features",
          status: "needs_work",
          feedback:
            "The main features should be selected more clearly instead of describing details equally.",
        },
        {
          label: "Data comparison",
          status: "needs_work",
          feedback:
            "Comparisons need to be more specific and linked to the visual data.",
        },
        {
          label: "Accuracy",
          status: "needs_work",
          feedback:
            "Make sure every figure or trend described accurately matches the prompt and visual information.",
        },
        {
          label: "Objective reporting",
          status: "strong",
          feedback:
            "The response should stay descriptive and avoid personal opinions or explanations outside the data.",
        },
      ],
    };
  }

  return {
    task_type: "task2",
    items: [
      {
        label: "Position",
        status: "needs_work",
        feedback:
          "The position needs to be stated more directly and maintained throughout the essay.",
      },
      {
        label: "Idea development",
        status: "needs_work",
        feedback:
          "The main ideas are relevant but need more explanation of cause, effect, or impact.",
      },
      {
        label: "Examples",
        status: "needs_work",
        feedback:
          "Examples should be more specific and clearly connected to the argument.",
      },
      {
        label: "Paragraphing",
        status: "needs_work",
        feedback:
          "Paragraphs should each develop one clear main idea with logical progression.",
      },
      {
        label: "Task response",
        status: "needs_work",
        feedback:
          "The response addresses the task, but the answer needs fuller development to reach a higher band.",
      },
    ],
  };
}

function getChineseTaskSpecificFallback(
  taskType: WritingFeedbackOutput["task_specific_feedback"]["task_type"],
): WritingFeedbackOutput["task_specific_feedback"] {
  if (taskType === "task1") {
    return {
      task_type: "task1",
      items: [
        {
          label: "总览 Overview",
          status: "needs_work",
          feedback: "答案需要更清楚的 overview，总结主要趋势或整体特征。",
        },
        {
          label: "主要特征 Key features",
          status: "needs_work",
          feedback: "主要特征需要筛选得更明确，不要把所有细节平均描述。",
        },
        {
          label: "数据比较 Data comparison",
          status: "needs_work",
          feedback: "数据比较需要更具体，并且要和图表信息直接对应。",
        },
        {
          label: "准确性 Accuracy",
          status: "needs_work",
          feedback: "描述数字和趋势时，要确保和题目及 visual information 完全一致。",
        },
        {
          label: "客观描述 Objective reporting",
          status: "strong",
          feedback: "Task 1 应保持客观描述，避免加入个人观点或图表外解释。",
        },
      ],
    };
  }

  return {
    task_type: "task2",
    items: [
      {
        label: "立场 Position",
        status: "needs_work",
        feedback: "立场需要更直接地写清楚，并在全文保持一致。",
      },
      {
        label: "观点展开 Idea development",
        status: "needs_work",
        feedback: "观点相关，但需要进一步解释原因、影响或结果。",
      },
      {
        label: "例子 Examples",
        status: "needs_work",
        feedback: "例子需要更具体，并且要和论点明确连接。",
      },
      {
        label: "段落结构 Paragraphing",
        status: "needs_work",
        feedback: "每个主体段应围绕一个中心观点展开，并保持清楚推进。",
      },
      {
        label: "任务回应 Task response",
        status: "needs_work",
        feedback: "文章回应了题目，但展开不足，暂时难以支撑更高 Band。",
      },
    ],
  };
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

function buildWritingTaskTitle(taskType: number, topic: string) {
  return `Task ${normalizeTaskType(taskType)}: ${topic}`;
}

function summarizePrompt(prompt: string) {
  return prompt.length > 180 ? `${prompt.slice(0, 177)}...` : prompt;
}

function normalizeTaskType(taskType: number): 1 | 2 {
  return taskType === 1 ? 1 : 2;
}

function buildWeakAreas(feedback: CalibratedWritingFeedbackOutput) {
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

function formatSentenceImprovementForStorage(
  item: WritingSentenceImprovement,
) {
  return `Original: ${item.original}\nImproved: ${item.improved}\nWhy: ${item.explanation}`;
}

function normalizeSentenceImprovements(
  rawAiOutput: unknown,
  legacyValue: unknown,
): WritingSentenceImprovement[] {
  const fromRaw =
    rawAiOutput && typeof rawAiOutput === "object"
      ? (rawAiOutput as { sentence_improvements?: unknown })
          .sentence_improvements
      : null;

  const normalizedRaw = normalizeSentenceImprovementArray(fromRaw);
  if (normalizedRaw.length) {
    return normalizedRaw;
  }

  return normalizeStringArray(legacyValue).map((item) => ({
    original: item,
    improved: "",
    explanation: "",
  }));
}

function normalizeSentenceImprovementArray(
  value: unknown,
): WritingSentenceImprovement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): WritingSentenceImprovement | null => {
      if (typeof item === "string") {
        return {
          original: item,
          improved: "",
          explanation: "",
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const original = candidate.original;
      const improved = candidate.improved;
      const explanation = candidate.explanation;

      if (
        typeof original !== "string" ||
        typeof improved !== "string" ||
        typeof explanation !== "string"
      ) {
        return null;
      }

      return {
        original,
        improved,
        explanation,
      };
    })
    .filter((item): item is WritingSentenceImprovement => Boolean(item));
}

function normalizeTaskSpecificFeedback(
  rawAiOutput: unknown,
): WritingTaskSpecificFeedback | null {
  if (!rawAiOutput || typeof rawAiOutput !== "object") {
    return null;
  }

  const value = (rawAiOutput as { task_specific_feedback?: unknown })
    .task_specific_feedback;

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const taskType = candidate.task_type;
  const items = candidate.items;

  if (
    (taskType !== "task1" && taskType !== "task2") ||
    !Array.isArray(items)
  ) {
    return null;
  }

  const normalizedItems = items
    .map((item): WritingTaskSpecificFeedbackItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const itemCandidate = item as Record<string, unknown>;
      const label = itemCandidate.label;
      const status = itemCandidate.status;
      const feedback = itemCandidate.feedback;

      if (
        typeof label !== "string" ||
        typeof feedback !== "string" ||
        (status !== "strong" &&
          status !== "needs_work" &&
          status !== "missing")
      ) {
        return null;
      }

      return {
        label,
        status,
        feedback,
      };
    })
    .filter((item): item is WritingTaskSpecificFeedbackItem => Boolean(item));

  if (!normalizedItems.length) {
    return null;
  }

  return {
    taskType,
    items: normalizedItems,
  };
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
