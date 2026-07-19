import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWritingDisplayTitle } from "@/lib/writing-task-display";
import {
  normalizeWritingVisualData,
  writingVisualDataSchema,
} from "@/lib/writing-visual-data";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

const contentDetailQuerySchema = z.object({
  type: z.enum(["reading", "listening", "writing"]),
  id: z.string().uuid(),
});

const editableQuestionSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  type: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.unknown()).default([]),
  metadata: z.unknown().optional(),
  correctAnswer: z.string().default(""),
  acceptableAnswers: z.array(z.string()).default([]),
  explanationZh: z.string().nullable().optional(),
  explanationEn: z.string().nullable().optional(),
  synonyms: z.array(z.unknown()).default([]),
  vocabulary: z.array(z.unknown()).default([]),
});

const patchContentDetailSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("reading"),
    id: z.string().uuid(),
    data: z.object({
      title: z.string().min(1),
      band: z.number().int().min(5).max(9),
      topic: z.string().min(1),
      passage: z.string().min(1),
      questions: z.array(editableQuestionSchema).optional(),
    }),
  }),
  z.object({
    type: z.literal("listening"),
    id: z.string().uuid(),
    data: z.object({
      title: z.string().min(1),
      band: z.number().int().min(5).max(9).nullable(),
      topic: z.string().min(1),
      section: z.number().int().min(1).max(4),
      script: z.string().min(1),
      questions: z.array(editableQuestionSchema).optional(),
    }),
  }),
  z.object({
    type: z.literal("writing"),
    id: z.string().uuid(),
    data: z.object({
      title: z.string().min(1).nullable().optional(),
      taskType: z.number().int().min(1).max(2),
      bandTarget: z.number().int().min(5).max(9).nullable(),
      topic: z.string().min(1),
      prompt: z.string().min(1),
      sampleAnswerBand7: z.string().nullable().optional(),
      sampleAnswerBand8: z.string().nullable().optional(),
      sampleAnswerBand9: z.string().nullable().optional(),
      scoringNotes: z.unknown(),
      visualData: writingVisualDataSchema.nullable().optional(),
    }),
  }),
]);

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
      "id,title,task_type,topic,prompt,visual_data,band_target,sample_answer_band_7,sample_answer_band_8,sample_answer_band_9,scoring_notes,source_type,status,created_by,published_at,created_at,updated_at",
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
      title: buildWritingDetailTitle(data),
      taskType: data.task_type,
      topic: data.topic,
      prompt: data.prompt,
      visualData: data.visual_data,
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

export async function PATCH(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid content update payload." },
      { status: 400 },
    );
  }

  const parsed = patchContentDetailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid content update payload." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const input = parsed.data;

  if (input.type === "reading") {
    const current = await loadCurrentReading(admin, input.id);

    if ("response" in current) {
      return current.response;
    }

    const changedFields = getChangedFields(
      {
        title: current.data.title,
        band: current.data.band,
        topic: current.data.topic,
        passage: current.data.passage,
      },
      input.data,
    );
    const { error } = await admin
      .from("reading_sets")
      .update({
        title: input.data.title,
        band: input.data.band,
        topic: input.data.topic,
        passage: input.data.passage,
      })
      .eq("id", input.id);

    if (error) {
      return apiErrorResponse(error, {
        fallback: "Failed to update content.",
        status: 400,
        context: "admin_reading_update_failed",
      });
    }

    if (input.data.questions) {
      const result = await updateQuestionsAndAnswers(
        admin,
        "reading",
        input.id,
        input.data.questions,
      );

      if (result) {
        return result;
      }

      changedFields.push("questions");
      changedFields.push("answers");
    }

    await writeContentUpdatedLog({
      adminUserId: auth.userId,
      contentType: input.type,
      contentId: input.id,
      changedFields,
    });

    return NextResponse.json({ ok: true, changedFields });
  }

  if (input.type === "listening") {
    const current = await loadCurrentListening(admin, input.id);

    if ("response" in current) {
      return current.response;
    }

    const changedFields = getChangedFields(
      {
        title: current.data.title,
        band: current.data.band,
        topic: current.data.topic,
        section: current.data.section,
        script: current.data.script,
      },
      input.data,
    );
    const scriptChanged = current.data.script !== input.data.script;
    const updatePayload: Record<string, unknown> = {
      title: input.data.title,
      band: input.data.band,
      topic: input.data.topic,
      section: input.data.section,
      script: input.data.script,
    };

    if (scriptChanged) {
      updatePayload.audio_status = "pending";
      updatePayload.audio_url = null;
      changedFields.push("audio_status");
      changedFields.push("audio_url");
    }

    const { error } = await admin
      .from("listening_sets")
      .update(updatePayload)
      .eq("id", input.id);

    if (error) {
      return apiErrorResponse(error, {
        fallback: "Failed to update content.",
        status: 400,
        context: "admin_listening_update_failed",
      });
    }

    if (input.data.questions) {
      const result = await updateQuestionsAndAnswers(
        admin,
        "listening",
        input.id,
        input.data.questions,
      );

      if (result) {
        return result;
      }

      changedFields.push("questions");
      changedFields.push("answers");
    }

    await writeContentUpdatedLog({
      adminUserId: auth.userId,
      contentType: input.type,
      contentId: input.id,
      changedFields,
    });

    return NextResponse.json({
      ok: true,
      changedFields,
      audioStatus: scriptChanged ? "pending" : current.data.audio_status,
      audioUrl: scriptChanged ? null : current.data.audio_url,
    });
  }

  const current = await loadCurrentWriting(admin, input.id);

  if ("response" in current) {
    return current.response;
  }

  const normalizedWritingTitle =
    input.data.title === undefined
      ? current.data.title
      : input.data.title?.trim() || null;
  const changedFields = getChangedFields(
    {
      taskType: current.data.task_type,
      title: current.data.title,
      bandTarget: current.data.band_target,
      topic: current.data.topic,
      prompt: current.data.prompt,
      sampleAnswerBand7: current.data.sample_answer_band_7,
      sampleAnswerBand8: current.data.sample_answer_band_8,
      sampleAnswerBand9: current.data.sample_answer_band_9,
      scoringNotes: current.data.scoring_notes,
      visualData: current.data.visual_data,
    },
    {
      ...input.data,
      title: normalizedWritingTitle,
    },
  );
  const { error } = await admin
    .from("writing_tasks")
    .update({
      task_type: input.data.taskType,
      title: normalizedWritingTitle,
      topic: input.data.topic,
      prompt: input.data.prompt,
      band_target: input.data.bandTarget,
      sample_answer_band_7: input.data.sampleAnswerBand7 ?? null,
      sample_answer_band_8: input.data.sampleAnswerBand8 ?? null,
      sample_answer_band_9: input.data.sampleAnswerBand9 ?? null,
      scoring_notes: input.data.scoringNotes,
      visual_data: input.data.visualData ?? null,
    })
    .eq("id", input.id);

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to update content.",
      status: 400,
      context: "admin_writing_update_failed",
    });
  }

  await writeContentUpdatedLog({
    adminUserId: auth.userId,
    contentType: input.type,
    contentId: input.id,
    changedFields,
  });

  return NextResponse.json({ ok: true, changedFields });
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

function buildWritingDetailTitle(data: {
  title: string | null;
  task_type: number;
  topic: string;
  prompt: string;
  visual_data: unknown;
}) {
  return getWritingDisplayTitle({
    taskType: data.task_type === 1 ? 1 : 2,
    topic: data.topic,
    prompt: data.prompt,
    title: data.title,
    visualTitle: normalizeWritingVisualData(data.visual_data)?.title,
  });
}

async function loadCurrentReading(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
) {
  const { data, error } = await admin
    .from("reading_sets")
    .select("id,title,band,topic,passage")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      response: apiErrorResponse(error, {
        fallback: "Failed to load content.",
        status: 400,
        context: "admin_reading_current_load_failed",
      }),
    };
  }

  if (!data) {
    return { response: NextResponse.json({ error: "Content not found." }, { status: 404 }) };
  }

  return { data };
}

async function loadCurrentListening(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
) {
  const { data, error } = await admin
    .from("listening_sets")
    .select("id,title,band,topic,section,script,audio_status,audio_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      response: apiErrorResponse(error, {
        fallback: "Failed to load content.",
        status: 400,
        context: "admin_listening_current_load_failed",
      }),
    };
  }

  if (!data) {
    return { response: NextResponse.json({ error: "Content not found." }, { status: 404 }) };
  }

  return { data };
}

async function loadCurrentWriting(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
) {
  const { data, error } = await admin
    .from("writing_tasks")
    .select(
      "id,title,task_type,topic,prompt,visual_data,band_target,sample_answer_band_7,sample_answer_band_8,sample_answer_band_9,scoring_notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      response: apiErrorResponse(error, {
        fallback: "Failed to load content.",
        status: 400,
        context: "admin_writing_current_load_failed",
      }),
    };
  }

  if (!data) {
    return { response: NextResponse.json({ error: "Content not found." }, { status: 404 }) };
  }

  return { data };
}

async function updateQuestionsAndAnswers(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  setType: "reading" | "listening",
  setId: string,
  questions: z.infer<typeof editableQuestionSchema>[],
) {
  const { data: existingQuestions, error: existingError } = await admin
    .from("generated_questions")
    .select("id")
    .eq("set_type", setType)
    .eq("set_id", setId);

  if (existingError) {
    return apiErrorResponse(existingError, {
      fallback: "Failed to load questions.",
      status: 400,
      context: "admin_questions_validate_failed",
    });
  }

  const existingQuestionIds = new Set(
    (existingQuestions ?? []).map((question) => question.id),
  );
  const submittedQuestionIds = new Set<string>();

  for (const question of questions) {
    if (!existingQuestionIds.has(question.id)) {
      return NextResponse.json(
        { error: `Question ${question.id} does not belong to this content.` },
        { status: 400 },
      );
    }

    if (submittedQuestionIds.has(question.id)) {
      return NextResponse.json(
        { error: `Duplicate question id: ${question.id}` },
        { status: 400 },
      );
    }

    if (question.type === "multiple_choice" && !question.options.length) {
      return NextResponse.json(
        { error: `Question ${question.number} requires options.` },
        { status: 400 },
      );
    }

    submittedQuestionIds.add(question.id);
  }

  const { data: existingAnswers, error: answerLoadError } = await admin
    .from("generated_answers")
    .select("id,question_id")
    .in(
      "question_id",
      questions.map((question) => question.id),
    );

  if (answerLoadError) {
    return apiErrorResponse(answerLoadError, {
      fallback: "Failed to load answers.",
      status: 400,
      context: "admin_answers_validate_failed",
    });
  }

  const answerByQuestionId = new Map(
    (existingAnswers ?? []).map((answer) => [answer.question_id, answer.id]),
  );

  for (const question of questions) {
    const { error: questionError } = await admin
      .from("generated_questions")
      .update({
        question_type: question.type,
        question_number: question.number,
        prompt: question.prompt,
        options: question.options,
        metadata: question.metadata ?? {},
      })
      .eq("id", question.id)
      .eq("set_type", setType)
      .eq("set_id", setId);

    if (questionError) {
      return apiErrorResponse(questionError, {
        fallback: "Failed to update questions.",
        status: 400,
        context: "admin_question_update_failed",
      });
    }

    const correctAnswer = buildCorrectAnswer(question);
    const answerPayload = {
      correct_answer: correctAnswer,
      explanation_zh: question.explanationZh ?? null,
      explanation_en: question.explanationEn ?? null,
      synonyms: question.synonyms,
      vocabulary: question.vocabulary,
    };
    const answerId = answerByQuestionId.get(question.id);

    if (answerId) {
      const { error: answerError } = await admin
        .from("generated_answers")
        .update(answerPayload)
        .eq("id", answerId);

      if (answerError) {
        return apiErrorResponse(answerError, {
          fallback: "Failed to update answers.",
          status: 400,
          context: "admin_answer_update_failed",
        });
      }
    } else {
      const { error: answerError } = await admin
        .from("generated_answers")
        .insert({
          question_id: question.id,
          ...answerPayload,
        });

      if (answerError) {
        return apiErrorResponse(answerError, {
          fallback: "Failed to update answers.",
          status: 400,
          context: "admin_answer_insert_failed",
        });
      }
    }
  }

  return null;
}

function buildCorrectAnswer(question: z.infer<typeof editableQuestionSchema>) {
  const answers = [question.correctAnswer, ...question.acceptableAnswers]
    .map((answer) => answer.trim())
    .filter(Boolean);
  const uniqueAnswers = Array.from(new Set(answers));

  return uniqueAnswers.join("||");
}

function getChangedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}

async function writeContentUpdatedLog({
  adminUserId,
  contentType,
  contentId,
  changedFields,
}: {
  adminUserId: string;
  contentType: string;
  contentId: string;
  changedFields: string[];
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action: "content_updated",
    target_type: contentType,
    target_id: contentId,
    metadata: {
      content_type: contentType,
      content_id: contentId,
      changed_fields: Array.from(new Set(changedFields)),
    },
  });
}
