import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

const contentDetailQuerySchema = z.object({
  type: z.enum(["reading", "listening", "writing"]),
  id: z.string().uuid(),
});

type QuestionRow = {
  id: string;
  question_type: string;
  question_number: number;
  prompt: string;
  options: unknown;
  metadata: unknown;
};

type AnswerRow = {
  question_id: string;
  correct_answer: string;
  explanation_zh: string | null;
  explanation_en: string | null;
  synonyms: unknown;
  vocabulary: unknown;
};

export async function GET(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = contentDetailQuerySchema.safeParse({
    type: url.searchParams.get("type"),
    id: url.searchParams.get("id"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid content detail request." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { type, id } = parsed.data;

  if (type === "reading") {
    const { data, error } = await admin
      .from("reading_sets")
      .select(
        "id,title,topic,band,length_words,passage,source_type,status,created_by,published_at,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiErrorResponse(error, {
        fallback: "Failed to load content.",
        status: 400,
        context: "admin_reading_detail_load_failed",
      });
    }

    if (!data) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    const questions = await loadQuestionsAndAnswers(admin, "reading", id);

    if ("error" in questions) {
      return questions.error;
    }

    return NextResponse.json({
      type,
      content: {
        id: data.id,
        title: data.title,
        topic: data.topic,
        band: data.band,
        lengthWords: data.length_words,
        passage: data.passage,
        source: formatSource(data.source_type),
        status: data.status,
        createdBy: data.created_by,
        publishedAt: data.published_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        questions,
      },
    });
  }

  if (type === "listening") {
    const { data, error } = await admin
      .from("listening_sets")
      .select(
        "id,title,topic,band,section,script,audio_url,audio_status,tts_voice_mapping,source_type,status,created_by,published_at,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiErrorResponse(error, {
        fallback: "Failed to load content.",
        status: 400,
        context: "admin_listening_detail_load_failed",
      });
    }

    if (!data) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    const questions = await loadQuestionsAndAnswers(admin, "listening", id);

    if ("error" in questions) {
      return questions.error;
    }

    return NextResponse.json({
      type,
      content: {
        id: data.id,
        title: data.title,
        topic: data.topic,
        band: data.band,
        section: data.section,
        script: data.script,
        audioUrl: data.audio_url,
        audioStatus: data.audio_status,
        ttsVoiceMapping: data.tts_voice_mapping,
        source: formatSource(data.source_type),
        status: data.status,
        createdBy: data.created_by,
        publishedAt: data.published_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        questions,
      },
    });
  }

  const { data, error } = await admin
    .from("writing_tasks")
    .select(
      "id,task_type,topic,prompt,band_target,sample_answer_band_7,sample_answer_band_8,sample_answer_band_9,scoring_notes,source_type,status,created_by,published_at,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to load content.",
      status: 400,
      context: "admin_writing_detail_load_failed",
    });
  }

  if (!data) {
    return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  return NextResponse.json({
    type,
    content: {
      id: data.id,
      title: `Task ${data.task_type}: ${data.topic}`,
      taskType: data.task_type,
      topic: data.topic,
      prompt: data.prompt,
      bandTarget: data.band_target,
      suggestedTimeMinutes: data.task_type === 1 ? 20 : 40,
      minimumWords: data.task_type === 1 ? 150 : 250,
      sampleAnswerBand7: data.sample_answer_band_7,
      sampleAnswerBand8: data.sample_answer_band_8,
      sampleAnswerBand9: data.sample_answer_band_9,
      scoringNotes: data.scoring_notes,
      source: formatSource(data.source_type),
      status: data.status,
      createdBy: data.created_by,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}

async function loadQuestionsAndAnswers(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  setType: "reading" | "listening",
  setId: string,
) {
  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_type,question_number,prompt,options,metadata")
    .eq("set_type", setType)
    .eq("set_id", setId)
    .order("question_number", { ascending: true });

  if (questionError) {
    return {
      error: apiErrorResponse(questionError, {
        fallback: "Failed to load questions.",
        status: 400,
        context: "admin_content_questions_load_failed",
      }),
    };
  }

  const questionRows = (questions ?? []) as QuestionRow[];
  const questionIds = questionRows.map((question) => question.id);
  const { data: answers, error: answerError } = questionIds.length
    ? await admin
        .from("generated_answers")
        .select(
          "question_id,correct_answer,explanation_zh,explanation_en,synonyms,vocabulary",
        )
        .in("question_id", questionIds)
    : { data: [], error: null };

  if (answerError) {
    return {
      error: apiErrorResponse(answerError, {
        fallback: "Failed to load answers.",
        status: 400,
        context: "admin_content_answers_load_failed",
      }),
    };
  }

  const answerByQuestionId = new Map(
    ((answers ?? []) as AnswerRow[]).map((answer) => [
      answer.question_id,
      answer,
    ]),
  );

  return questionRows.map((question) => {
    const answer = answerByQuestionId.get(question.id);
    const correctAnswer = answer?.correct_answer ?? "";

    return {
      id: question.id,
      number: question.question_number,
      type: question.question_type,
      prompt: question.prompt,
      options: normalizeArray(question.options),
      metadata: question.metadata ?? {},
      correctAnswer,
      acceptableAnswers: getAcceptableAnswers(correctAnswer),
      explanationZh: answer?.explanation_zh ?? null,
      explanationEn: answer?.explanation_en ?? null,
      synonyms: normalizeArray(answer?.synonyms),
      vocabulary: normalizeArray(answer?.vocabulary),
    };
  });
}

function getAcceptableAnswers(correctAnswer: string) {
  return correctAnswer
    .split(/\s*(?:\|\||\||;)\s*/)
    .flatMap((answer) => answer.split(/\s+\/\s+/))
    .map((answer) => answer.trim())
    .filter(Boolean);
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    ai_generated: "AI Generated",
    admin_original: "Admin Original",
    user_private_upload: "User Upload",
    official_public_link: "Official Link",
  };

  return labels[source] ?? source;
}
