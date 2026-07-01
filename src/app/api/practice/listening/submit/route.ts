import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  estimateListeningBand,
  isPracticeAnswerCorrect,
  normalizePracticeAnswer,
} from "@/server/services/listening-practice";

const submitListeningPracticeSchema = z.object({
  listeningSetId: z.string().uuid(),
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
      { error: "Supabase is required for real Listening practice." },
      { status: 500 },
    );
  }

  const input = submitListeningPracticeSchema.parse(await request.json());
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后提交成绩。" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: listeningSet, error: setError } = await admin
    .from("listening_sets")
    .select("id,title,band,topic,section,status")
    .eq("id", input.listeningSetId)
    .eq("status", "published")
    .maybeSingle();

  if (setError) {
    return NextResponse.json({ error: setError.message }, { status: 400 });
  }

  if (!listeningSet) {
    return NextResponse.json(
      { error: "Listening set not found or not published." },
      { status: 404 },
    );
  }

  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_number")
    .eq("set_type", "listening")
    .eq("set_id", listeningSet.id)
    .order("question_number", { ascending: true });

  if (questionError) {
    return NextResponse.json({ error: questionError.message }, { status: 400 });
  }

  const questionRows = (questions ?? []) as QuestionRow[];
  const questionIds = questionRows.map((question) => question.id);

  if (!questionIds.length) {
    return NextResponse.json(
      { error: "This Listening set has no questions yet." },
      { status: 400 },
    );
  }

  const { data: answerRows, error: answerError } = await admin
    .from("generated_answers")
    .select("question_id,correct_answer")
    .in("question_id", questionIds);

  if (answerError) {
    return NextResponse.json({ error: answerError.message }, { status: 400 });
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
  const bandEstimate = estimateListeningBand(correctCount, totalQuestions);

  const { data: attempt, error: attemptError } = await admin
    .from("practice_history")
    .insert({
      user_id: user.id,
      skill: "listening",
      content_type: "listening",
      content_id: listeningSet.id,
      set_type: "listening_set",
      set_id: listeningSet.id,
      title: listeningSet.title,
      score_label: `${correctCount}/${totalQuestions} correct`,
      score: percentage,
      band_estimate: bandEstimate,
      accuracy: percentage,
      total_questions: totalQuestions,
      correct_count: correctCount,
      detail: `Section ${listeningSet.section} · Band ${listeningSet.band} · ${listeningSet.topic}`,
      weak_areas:
        percentage >= 80
          ? ["听力速度保持", "Section 4 细节稳定性"]
          : ["关键词预测", "拼写准确率", "同义替换识别"],
      next_action:
        percentage >= 80
          ? "继续挑战更高 Band 或完整限时 Listening 套题。"
          : "先复盘错题答案，再针对填空和选择题做专项训练。",
      time_spent_seconds: input.timeSpentSeconds,
      answers: input.answers,
    })
    .select("id")
    .single();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 400 });
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
    return NextResponse.json({ error: userAnswerError.message }, { status: 400 });
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
