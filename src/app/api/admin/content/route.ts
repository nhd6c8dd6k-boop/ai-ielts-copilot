import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

const adminContentMutationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["reading", "listening", "writing"]),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
});

const tableByType = {
  reading: "reading_sets",
  listening: "listening_sets",
  writing: "writing_tasks",
} as const;

type PublishValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export async function PATCH(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = adminContentMutationSchema.parse(await request.json());

  if (!input.status) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (input.status === "published") {
    const validation = await validateBeforePublish(admin, input.type, input.id);

    if (!validation.ok) {
      await writeAdminLog({
        adminUserId: auth.userId,
        action: "content_publish_validation_failed",
        targetType: input.type,
        targetId: input.id,
        metadata: {
          errors: validation.errors,
          warnings: validation.warnings,
        },
      });

      return NextResponse.json(
        {
          error: "Content is not ready to publish.",
          validation,
        },
        { status: 400 },
      );
    }
  }

  const { error } = await admin
    .from(tableByType[input.type])
    .update({
      status: input.status,
      published_at:
        input.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to update content.",
      status: 400,
      context: "admin_content_update_failed",
    });
  }

  await writeAdminLog({
    adminUserId: auth.userId,
    action: "content_status_updated",
    targetType: input.type,
    targetId: input.id,
    metadata: { status: input.status },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = adminContentMutationSchema.parse(await request.json());
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(tableByType[input.type])
    .delete()
    .eq("id", input.id);

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to delete content.",
      status: 400,
      context: "admin_content_delete_failed",
    });
  }

  await writeAdminLog({
    adminUserId: auth.userId,
    action: "content_deleted",
    targetType: input.type,
    targetId: input.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}

async function writeAdminLog({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

async function validateBeforePublish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  type: "reading" | "listening" | "writing",
  id: string,
): Promise<PublishValidationResult> {
  if (type === "reading") {
    return validateReadingBeforePublish(admin, id);
  }

  if (type === "listening") {
    return validateListeningBeforePublish(admin, id);
  }

  return validateWritingBeforePublish(admin, id);
}

async function validateReadingBeforePublish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
): Promise<PublishValidationResult> {
  const result = createValidationResult();
  const { data, error } = await admin
    .from("reading_sets")
    .select("id,title,band,topic,passage")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    result.errors.push("Reading content not found.");
    return result;
  }

  requireText(data.title, "Reading title", result);
  requireNumber(data.band, "Reading band", result);
  requireText(data.topic, "Reading topic", result);
  requireText(data.passage, "Reading passage", result);

  if (countWords(data.passage) < 100) {
    result.errors.push("Reading passage is too short to publish.");
  }

  await validateQuestionsAndAnswers(admin, "reading", id, result);

  return result;
}

async function validateListeningBeforePublish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
): Promise<PublishValidationResult> {
  const result = createValidationResult();
  const { data, error } = await admin
    .from("listening_sets")
    .select("id,title,band,topic,section,script,audio_status,audio_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    result.errors.push("Listening content not found.");
    return result;
  }

  requireText(data.title, "Listening title", result);
  requireNumber(data.band, "Listening band", result);
  requireText(data.topic, "Listening topic", result);
  requireNumber(data.section, "Listening section", result);
  requireText(data.script, "Listening script", result);

  if (data.section < 1 || data.section > 4) {
    result.errors.push("Listening section must be between 1 and 4.");
  }

  if (data.audio_status === "ready" && !hasText(data.audio_url)) {
    result.errors.push("Listening audio is marked ready but audio_url is missing.");
  }

  if (data.audio_status !== "ready") {
    result.warnings.push(
      "Listening audio is pending. Published users will see script preview.",
    );
  }

  await validateQuestionsAndAnswers(admin, "listening", id, result);

  return result;
}

async function validateWritingBeforePublish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
): Promise<PublishValidationResult> {
  const result = createValidationResult();
  const { data, error } = await admin
    .from("writing_tasks")
    .select(
      "id,task_type,topic,prompt,band_target,sample_answer_band_7,sample_answer_band_8,sample_answer_band_9",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    result.errors.push("Writing content not found.");
    return result;
  }

  requireNumber(data.task_type, "Writing task type", result);
  requireText(data.topic, "Writing topic", result);
  requireText(data.prompt, "Writing prompt", result);

  if (![1, 2].includes(data.task_type)) {
    result.errors.push("Writing task type must be Task 1 or Task 2.");
  }

  const suggestedTimeMinutes = data.task_type === 1 ? 20 : 40;
  const minimumWords = data.task_type === 1 ? 150 : 250;

  if (suggestedTimeMinutes < 10 || suggestedTimeMinutes > 60) {
    result.errors.push("Writing suggested time is not reasonable.");
  }

  if (minimumWords < 100 || minimumWords > 350) {
    result.errors.push("Writing minimum words value is not reasonable.");
  }

  for (const [label, value] of [
    ["Band 7 sample", data.sample_answer_band_7],
    ["Band 8 sample", data.sample_answer_band_8],
    ["Band 9 sample", data.sample_answer_band_9],
  ] as const) {
    if (value !== null && typeof value !== "string") {
      result.errors.push(`${label} must be text when present.`);
    }
  }

  return result;
}

async function validateQuestionsAndAnswers(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  setType: "reading" | "listening",
  setId: string,
  result: PublishValidationResult,
) {
  const { data: questions, error: questionError } = await admin
    .from("generated_questions")
    .select("id,question_number,prompt")
    .eq("set_type", setType)
    .eq("set_id", setId)
    .order("question_number", { ascending: true });

  if (questionError) {
    result.errors.push("Failed to load questions for publish validation.");
    return;
  }

  if (!questions?.length) {
    result.errors.push("At least one question is required before publishing.");
    return;
  }

  const questionIds = questions.map((question) => question.id);
  const { data: answers, error: answerError } = await admin
    .from("generated_answers")
    .select("question_id,correct_answer,explanation_zh,explanation_en")
    .in("question_id", questionIds);

  if (answerError) {
    result.errors.push("Failed to load answers for publish validation.");
    return;
  }

  const answerByQuestionId = new Map(
    (answers ?? []).map((answer) => [answer.question_id, answer]),
  );

  for (const question of questions) {
    if (!hasText(question.prompt)) {
      result.errors.push(`Question ${question.question_number} is missing text.`);
    }

    const answer = answerByQuestionId.get(question.id);

    if (!answer) {
      result.errors.push(`Question ${question.question_number} is missing an answer.`);
      continue;
    }

    if (!hasText(answer.correct_answer)) {
      result.errors.push(
        `Question ${question.question_number} is missing a correct answer.`,
      );
    }

    if (!hasText(answer.explanation_zh) && !hasText(answer.explanation_en)) {
      result.warnings.push(
        `Question ${question.question_number} has no explanation yet.`,
      );
    }
  }
}

function createValidationResult(): PublishValidationResult {
  const result = {
    ok: true,
    errors: [] as string[],
    warnings: [] as string[],
  };

  Object.defineProperty(result, "ok", {
    get() {
      return result.errors.length === 0;
    },
    enumerable: true,
  });

  return result;
}

function requireText(
  value: string | null | undefined,
  label: string,
  result: PublishValidationResult,
) {
  if (!hasText(value)) {
    result.errors.push(`${label} is required.`);
  }
}

function requireNumber(
  value: number | null | undefined,
  label: string,
  result: PublishValidationResult,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    result.errors.push(`${label} is required.`);
  }
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function countWords(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  return value.trim().split(/\s+/).filter(Boolean).length;
}
