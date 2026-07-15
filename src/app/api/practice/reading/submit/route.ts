import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  estimateReadingBand,
  isPracticeAnswerCorrect,
  normalizePracticeAnswer,
} from "@/server/services/reading-practice";
import {
  buildUsageLimitResponse,
  canSubmitReadingSet,
} from "@/server/services/usage-limits";
import { apiErrorResponse } from "@/server/utils/api-error";

const submitReadingPracticeSchema = z.object({
  readingSetId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.string().default("")),
  timeSpentSeconds: z.number().int().nonnegative().default(0),
});

type QuestionRow = {
  id: string;
  question_number: number;
};

type AnswerRow = {
  question_id: string;
  correct_answer: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is required for real Reading practice." },
      { status: 500 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后提交成绩。" }, { status: 401 });
  }

  const input = submitReadingPracticeSchema.parse(await request.json());
  const admin = createSupabaseAdminClient();
  const { data: readingSet, error: setError } = await admin
    .from("reading_sets")
    .select("id,title,band,topic,status")
    .eq("id", input.readingSetId)
    .eq("status", "published")
    .maybeSingle();

  if (setError) {
    return apiErrorResponse(setError, {
      fallback: "Failed to submit practice.",
      status: 400,
      context: "reading_submit_set_load_failed",
    });
  }

  if (!readingSet) {
    return NextResponse.json(
      { error: "Reading set not found or not published." },
      { status: 404 },
    );
  }

  const usageDecision = await canSubmitReadingSet(user.id, readingSet.id);

  if (!usageDecision.allowed) {
    return NextResponse.json(buildUsageLimitResponse(usageDecision), {
      status: 403,
    });
  }

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_number")
    .eq("set_type", "reading")
    .eq("set_id", readingSet.id)
    .order("question_number", { ascending: true });

  if (questionError) {
    return apiErrorResponse(questionError, {
      fallback: "Failed to submit practice.",
      status: 400,
      context: "reading_submit_questions_load_failed",
    });
  }

  const questionRows = (questions ?? []) as QuestionRow[];
  const questionIds = questionRows.map((question) => question.id);

  if (!questionIds.length) {
    return NextResponse.json(
      { error: "This Reading set has no questions yet." },
      { status: 400 },
    );
  }

  const { data: answerRows, error: answerError } = await admin
    .from("generated_answers")
    .select("question_id,correct_answer")
    .in("question_id", questionIds);

  if (answerError) {
    return apiErrorResponse(answerError, {
      fallback: "Failed to submit practice.",
      status: 400,
      context: "reading_submit_answers_load_failed",
    });
  }

  const answerByQuestionId = new Map(
    ((answerRows ?? []) as AnswerRow[]).map((answer) => [
      answer.question_id,
      answer.correct_answer,
    ]),
  );
  const gradedAnswers = questionRows.map((question) => {
    const userAnswer = normalizePracticeAnswer(input.answers[question.id] ?? "");
    const correctAnswer = answerByQuestionId.get(question.id) ?? "";
    const isCorrect = correctAnswer
      ? isPracticeAnswerCorrect({ userAnswer, correctAnswer })
      : false;

    return {
      questionId: question.id,
      userAnswer,
      correctAnswer,
      isCorrect,
    };
  });
  const totalQuestions = gradedAnswers.length;
  const correctCount = gradedAnswers.filter((answer) => answer.isCorrect).length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const bandEstimate = estimateReadingBand(correctCount, totalQuestions);

  const { data: attempt, error: attemptError } = await admin
    .from("practice_history")
    .insert({
      user_id: user.id,
      skill: "reading",
      content_type: "reading",
      content_id: readingSet.id,
      set_type: "reading_set",
      set_id: readingSet.id,
      title: readingSet.title,
      score_label: `${correctCount}/${totalQuestions} correct`,
      score: percentage,
      band_estimate: bandEstimate,
      accuracy: percentage,
      total_questions: totalQuestions,
      correct_count: correctCount,
      detail: `Band ${readingSet.band} · ${readingSet.topic}`,
      weak_areas:
        percentage >= 80
          ? ["速度保持", "高难题稳定性"]
          : ["定位能力", "同义替换", "细节题准确率"],
      next_action:
        percentage >= 80
          ? "继续挑战更高 Band 或限时完成完整套题。"
          : "优先复盘错题解析，并针对薄弱题型进行专项练习。",
      time_spent_seconds: input.timeSpentSeconds,
      answers: input.answers,
    })
    .select("id")
    .single();

  if (attemptError) {
    return apiErrorResponse(attemptError, {
      fallback: "Failed to submit practice.",
      status: 400,
      context: "reading_submit_attempt_insert_failed",
    });
  }

  const { error: userAnswerError } = await admin.from("user_answers").insert(
    gradedAnswers.map((answer) => ({
      attempt_id: attempt.id,
      question_id: answer.questionId,
      user_answer: answer.userAnswer,
      correct_answer: answer.correctAnswer,
      is_correct: answer.isCorrect,
    })),
  );

  if (userAnswerError) {
    return apiErrorResponse(userAnswerError, {
      fallback: "Failed to submit practice.",
      status: 400,
      context: "reading_submit_user_answers_insert_failed",
    });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    score: percentage,
    correctCount,
    totalQuestions,
    percentage,
    bandEstimate,
  });
}
