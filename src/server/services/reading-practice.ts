import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PublishedReadingSummary = {
  id: string;
  title: string;
  band: number;
  topic: string;
  questionCount: number;
  estimatedTimeMinutes: number;
  createdAt: string;
  completion: PracticeCompletionSummary | null;
};

export type PracticeCompletionSummary = {
  completed: true;
  lastScoreLabel: string;
  lastPractisedAt: string;
};

export type ReadingPracticeQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  options: string[];
};

export type ReadingPracticeSet = {
  id: string;
  title: string;
  band: number;
  topic: string;
  lengthWords: number;
  passage: string;
  estimatedTimeMinutes: number;
  questions: ReadingPracticeQuestion[];
};

export type ReadingAttemptResult = {
  id: string;
  title: string;
  bandEstimate: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  timeSpentSeconds: number;
  submittedAt: string;
  questions: Array<{
    id: string;
    number: number;
    type: string;
    prompt: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanationZh: string | null;
    explanationEn: string | null;
    vocabulary: unknown[];
    synonyms: string[];
  }>;
};

type RawQuestionRow = {
  id: string;
  question_type: string;
  question_number: number;
  prompt: string;
  options: unknown;
  metadata?: unknown;
};

type RawAnswerRow = {
  question_id: string;
  correct_answer: string;
  explanation_zh: string | null;
  explanation_en: string | null;
  vocabulary: unknown;
  synonyms: unknown;
};

export const getPublishedReadingSummaries = cache(async (userId?: string | null) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data: sets, error } = await admin
    .from("reading_sets")
    .select("id,title,band,topic,length_words,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const setIds = (sets ?? []).map((set) => set.id);

  if (!setIds.length) {
    return [];
  }

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("set_id")
    .eq("set_type", "reading")
    .in("set_id", setIds);

  if (questionError) {
    throw new Error(questionError.message);
  }

  const counts = new Map<string, number>();

  (questions ?? []).forEach((question) => {
    counts.set(question.set_id, (counts.get(question.set_id) ?? 0) + 1);
  });

  const completionBySetId = userId
    ? await getReadingCompletionBySetId({ userId, setIds })
    : new Map<string, PracticeCompletionSummary>();

  return (sets ?? []).map(
    (set): PublishedReadingSummary => ({
      id: set.id,
      title: set.title,
      band: set.band,
      topic: set.topic,
      questionCount: counts.get(set.id) ?? 0,
      estimatedTimeMinutes: estimateReadingTime(set.length_words),
      createdAt: set.created_at,
      completion: completionBySetId.get(set.id) ?? null,
    }),
  ).sort(sortIncompleteFirst);
});

async function getReadingCompletionBySetId({
  userId,
  setIds,
}: {
  userId: string;
  setIds: string[];
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("practice_history")
    .select("set_id,correct_count,total_questions,submitted_at,created_at")
    .eq("user_id", userId)
    .eq("skill", "reading")
    .in("set_id", setIds)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const completionBySetId = new Map<string, PracticeCompletionSummary>();

  for (const attempt of data ?? []) {
    if (!attempt.set_id || completionBySetId.has(attempt.set_id)) {
      continue;
    }

    completionBySetId.set(attempt.set_id, {
      completed: true,
      lastScoreLabel: `${attempt.correct_count}/${attempt.total_questions}`,
      lastPractisedAt: attempt.submitted_at ?? attempt.created_at,
    });
  }

  return completionBySetId;
}

function sortIncompleteFirst(
  a: { completion: PracticeCompletionSummary | null },
  b: { completion: PracticeCompletionSummary | null },
) {
  return Number(Boolean(a.completion)) - Number(Boolean(b.completion));
}

export const getPublishedReadingPracticeSet = cache(async (id: string) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: set, error } = await admin
    .from("reading_sets")
    .select("id,title,band,topic,length_words,passage,status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!set) {
    return null;
  }

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_type,question_number,prompt,options,metadata")
    .eq("set_type", "reading")
    .eq("set_id", set.id)
    .order("question_number", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  return {
    id: set.id,
    title: set.title,
    band: set.band,
    topic: set.topic,
    lengthWords: set.length_words,
    passage: set.passage,
    estimatedTimeMinutes: estimateReadingTime(set.length_words),
    questions: (questions ?? []).map(mapQuestionRow),
  } satisfies ReadingPracticeSet;
});

export async function getReadingAttemptResult({
  attemptId,
  userId,
}: {
  attemptId: string;
  userId: string;
}) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: attempt, error } = await admin
    .from("practice_history")
    .select(
      "id,user_id,title,score,band_estimate,total_questions,correct_count,time_spent_seconds,submitted_at,created_at",
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

  const { data: userAnswers, error: answerError } = await admin
    .from("user_answers")
    .select("question_id,user_answer,correct_answer,is_correct,created_at")
    .eq("attempt_id", attempt.id)
    .order("created_at", { ascending: true });

  if (answerError) {
    throw new Error(answerError.message);
  }

  const questionIds = (userAnswers ?? []).map((answer) => answer.question_id);
  const { data: questions, error: questionError } = questionIds.length
    ? await admin
        .from("generated_questions")
        .select("id,question_type,question_number,prompt,options,metadata")
        .in("id", questionIds)
    : { data: [], error: null };

  if (questionError) {
    throw new Error(questionError.message);
  }

  const { data: answerDetails, error: detailError } = questionIds.length
    ? await admin
        .from("generated_answers")
        .select(
          "question_id,correct_answer,explanation_zh,explanation_en,vocabulary,synonyms",
        )
        .in("question_id", questionIds)
    : { data: [], error: null };

  if (detailError) {
    throw new Error(detailError.message);
  }

  const questionById = new Map(
    (questions as RawQuestionRow[]).map((question) => [question.id, question]),
  );
  const answerByQuestionId = new Map(
    (answerDetails as RawAnswerRow[]).map((answer) => [
      answer.question_id,
      answer,
    ]),
  );
  const totalQuestions = Number(attempt.total_questions ?? 0);
  const correctCount = Number(attempt.correct_count ?? 0);

  return {
    id: attempt.id,
    title: attempt.title ?? "Reading practice",
    bandEstimate: Number(attempt.band_estimate ?? 0),
    score: Number(attempt.score ?? 0),
    totalQuestions,
    correctCount,
    percentage: totalQuestions
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0,
    timeSpentSeconds: Number(attempt.time_spent_seconds ?? 0),
    submittedAt: attempt.submitted_at ?? attempt.created_at,
    questions: (userAnswers ?? [])
      .map((answer) => {
        const question = questionById.get(answer.question_id);
        const detail = answerByQuestionId.get(answer.question_id);

        if (!question) {
          return null;
        }

        return {
          id: question.id,
          number: question.question_number,
          type: question.question_type,
          prompt: question.prompt,
          userAnswer: answer.user_answer,
          correctAnswer: answer.correct_answer,
          isCorrect: answer.is_correct,
          explanationZh: detail?.explanation_zh ?? null,
          explanationEn: detail?.explanation_en ?? null,
          vocabulary: normalizeArray(detail?.vocabulary),
          synonyms: normalizeStringArray(detail?.synonyms),
        };
      })
      .filter((item): item is ReadingAttemptResult["questions"][number] =>
        Boolean(item),
      )
      .sort((a, b) => a.number - b.number),
  } satisfies ReadingAttemptResult;
}

export function estimateReadingBand(correctCount: number, totalQuestions: number) {
  if (!totalQuestions) {
    return 0;
  }

  const raw40 = (correctCount / totalQuestions) * 40;

  if (raw40 >= 39) return 9;
  if (raw40 >= 37) return 8.5;
  if (raw40 >= 35) return 8;
  if (raw40 >= 33) return 7.5;
  if (raw40 >= 30) return 7;
  if (raw40 >= 27) return 6.5;
  if (raw40 >= 23) return 6;
  if (raw40 >= 19) return 5.5;
  if (raw40 >= 15) return 5;
  if (raw40 >= 13) return 4.5;
  return 4;
}

export function normalizePracticeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getAcceptedAnswers(correctAnswer: string) {
  return correctAnswer
    .split(/\s*(?:\|\||\||;)\s*/)
    .flatMap((answer) => answer.split(/\s+\/\s+/))
    .map((answer) => answer.trim())
    .filter(Boolean);
}

export function isPracticeAnswerCorrect({
  userAnswer,
  correctAnswer,
}: {
  userAnswer: string;
  correctAnswer: string;
}) {
  const normalizedUserAnswer = normalizePracticeAnswer(userAnswer);

  if (!normalizedUserAnswer) {
    return false;
  }

  return getAcceptedAnswers(correctAnswer).some((acceptedAnswer) => {
    const normalizedAcceptedAnswer = normalizePracticeAnswer(acceptedAnswer);

    return (
      normalizedUserAnswer === normalizedAcceptedAnswer ||
      normalizedUserAnswer.startsWith(`${normalizedAcceptedAnswer}.`) ||
      normalizedUserAnswer.startsWith(`${normalizedAcceptedAnswer} `) ||
      normalizedAcceptedAnswer.startsWith(`${normalizedUserAnswer}.`) ||
      normalizedAcceptedAnswer.startsWith(`${normalizedUserAnswer} `)
    );
  });
}

function estimateReadingTime(lengthWords: number) {
  if (lengthWords >= 1000) {
    return 22;
  }

  if (lengthWords >= 800) {
    return 18;
  }

  return 15;
}

function mapQuestionRow(question: RawQuestionRow): ReadingPracticeQuestion {
  return {
    id: question.id,
    number: question.question_number,
    type: question.question_type,
    prompt: question.prompt,
    options: normalizeStringArray(question.options),
  };
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}
