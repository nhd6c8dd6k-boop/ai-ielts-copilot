import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import {
  getDisplayAnswerParts,
  getListeningAnswerPartCount,
  isListeningAnswerCorrect,
} from "@/lib/listening-answer-parts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAcceptedAnswers,
  normalizePracticeAnswer,
  type PracticeCompletionSummary,
} from "@/server/services/reading-practice";

export type PublishedListeningSummary = {
  id: string;
  title: string;
  band: number;
  topic: string;
  section: number;
  questionCount: number;
  audioStatus: string;
  estimatedTimeMinutes: number;
  createdAt: string;
  completion: PracticeCompletionSummary | null;
};

export type ListeningPracticeQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  options: string[];
  answerCount: number;
};

export type ListeningExamPracticeSet = {
  id: string;
  title: string;
  band: number;
  topic: string;
  section: number;
  audioUrl: string;
  audioStatus: "ready";
  estimatedTimeMinutes: number;
  questions: ListeningPracticeQuestion[];
};

export type ListeningAttemptResult = {
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
    userAnswerParts: string[];
    correctAnswerParts: string[];
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
};

export function hasUsableAudioUrl(url: unknown): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export const getPublishedListeningSummaries = cache(
  async (userId?: string | null) => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data: sets, error } = await admin
    .from("listening_sets")
    .select("id,title,band,topic,section,audio_status,audio_url,created_at")
    .eq("status", "published")
    .eq("audio_status", "ready")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const readySets = (sets ?? []).filter((set) =>
    hasUsableAudioUrl(set.audio_url),
  );
  const setIds = readySets.map((set) => set.id);

  if (!setIds.length) {
    return [];
  }

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("set_id")
    .eq("set_type", "listening")
    .in("set_id", setIds);

  if (questionError) {
    throw new Error(questionError.message);
  }

  const counts = new Map<string, number>();

  (questions ?? []).forEach((question) => {
    counts.set(question.set_id, (counts.get(question.set_id) ?? 0) + 1);
  });

  const completionBySetId = userId
    ? await getListeningCompletionBySetId({ userId, setIds })
    : new Map<string, PracticeCompletionSummary>();

  return readySets.map(
    (set): PublishedListeningSummary => ({
      id: set.id,
      title: set.title,
      band: set.band,
      topic: set.topic,
      section: set.section,
      questionCount: counts.get(set.id) ?? 0,
      audioStatus: set.audio_status ?? "pending",
      estimatedTimeMinutes: estimateListeningTime(set.section),
      createdAt: set.created_at,
      completion: completionBySetId.get(set.id) ?? null,
    }),
  ).sort(sortIncompleteFirst);
  },
);

async function getListeningCompletionBySetId({
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
    .eq("skill", "listening")
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

export const getPublishedListeningPracticeSet = cache(async (id: string) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: set, error } = await admin
    .from("listening_sets")
    .select("id,title,band,topic,section,audio_url,audio_status,status")
    .eq("id", id)
    .eq("status", "published")
    .eq("audio_status", "ready")
    .not("audio_url", "is", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!set || !hasUsableAudioUrl(set.audio_url)) {
    return null;
  }

  const audioUrl = set.audio_url;

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_type,question_number,prompt,options,metadata")
    .eq("set_type", "listening")
    .eq("set_id", set.id)
    .order("question_number", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  const questionIds = ((questions ?? []) as RawQuestionRow[]).map(
    (question) => question.id,
  );
  const { data: answers, error: answerError } = questionIds.length
    ? await admin
        .from("generated_answers")
        .select("question_id,correct_answer")
        .in("question_id", questionIds)
    : { data: [], error: null };

  if (answerError) {
    throw new Error(answerError.message);
  }

  const answerByQuestionId = new Map(
    ((answers ?? []) as Pick<RawAnswerRow, "question_id" | "correct_answer">[]).map(
      (answer) => [answer.question_id, answer.correct_answer],
    ),
  );

  return {
    id: set.id,
    title: set.title,
    band: set.band,
    topic: set.topic,
    section: set.section,
    audioUrl,
    audioStatus: "ready",
    estimatedTimeMinutes: estimateListeningTime(set.section),
    questions: ((questions ?? []) as RawQuestionRow[]).map((question) =>
      mapQuestionRow(question, answerByQuestionId.get(question.id)),
    ),
  } satisfies ListeningExamPracticeSet;
});

export async function getListeningAttemptResult({
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
        .select("question_id,correct_answer,explanation_zh,explanation_en")
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
    title: attempt.title ?? "Listening practice",
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
          userAnswerParts: getDisplayAnswerParts(answer.user_answer),
          correctAnswerParts: getDisplayAnswerParts(answer.correct_answer),
        };
      })
      .filter((item): item is ListeningAttemptResult["questions"][number] =>
        Boolean(item),
      )
      .sort((a, b) => a.number - b.number),
  } satisfies ListeningAttemptResult;
}

export function estimateListeningBand(
  correctCount: number,
  totalQuestions: number,
) {
  if (!totalQuestions) {
    return 0;
  }

  const raw40 = (correctCount / totalQuestions) * 40;

  if (raw40 >= 39) return 9;
  if (raw40 >= 37) return 8.5;
  if (raw40 >= 35) return 8;
  if (raw40 >= 32) return 7.5;
  if (raw40 >= 30) return 7;
  if (raw40 >= 26) return 6.5;
  if (raw40 >= 23) return 6;
  if (raw40 >= 18) return 5.5;
  if (raw40 >= 16) return 5;
  if (raw40 >= 13) return 4.5;
  return 4;
}

export {
  getAcceptedAnswers,
  isListeningAnswerCorrect,
  normalizePracticeAnswer,
};

function estimateListeningTime(section: number) {
  return section === 4 ? 12 : 10;
}

function mapQuestionRow(
  question: RawQuestionRow,
  correctAnswer?: string,
): ListeningPracticeQuestion {
  return {
    id: question.id,
    number: question.question_number,
    type: question.question_type,
    prompt: question.prompt,
    options: normalizeStringArray(question.options),
    answerCount: getListeningAnswerPartCount({
      prompt: question.prompt,
      metadata: question.metadata,
      correctAnswer,
    }),
  };
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
