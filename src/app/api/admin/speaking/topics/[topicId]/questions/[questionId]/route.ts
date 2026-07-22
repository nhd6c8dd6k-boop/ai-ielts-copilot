import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/server/services/admin-auth";
import {
  deleteAdminSpeakingQuestion,
  updateAdminSpeakingQuestion,
} from "@/server/services/admin-speaking";
import { apiErrorResponse } from "@/server/utils/api-error";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const questionParamsSchema = z.object({
  topicId: z.string().uuid(),
  questionId: z.string().uuid(),
});

const questionMetadataSchema = z.object({
  questionOrder: z.number().int().min(1).max(200),
  question: z.string().trim().min(1).max(1000),
  answerTip: z.string().trim().max(1000).nullable(),
  cueCardPoints: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  preparationIdeas: z
    .array(z.string().trim().min(1).max(300))
    .max(12)
    .default([]),
  suggestedStructure: z
    .array(z.string().trim().min(1).max(300))
    .max(12)
    .default([]),
  directAnswer: z.string().trim().max(1000).nullable().default(null),
  mainReason: z.string().trim().max(1000).nullable().default(null),
  example: z.string().trim().max(1000).nullable().default(null),
  alternativePerspective: z.string().trim().max(1000).nullable().default(null),
  sampleBand6: z.string().trim().min(1).max(3000),
  sampleBand7: z.string().trim().min(1).max(3000),
  sampleBand8: z.string().trim().min(1).max(3000),
});

type RouteContext = {
  params: Promise<{
    topicId: string;
    questionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }

  const params = await context.params;
  const parsedParams = questionParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid Speaking question path." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsedBody = questionMetadataSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid Speaking question metadata." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const question = await updateAdminSpeakingQuestion({
      topicId: parsedParams.data.topicId,
      questionId: parsedParams.data.questionId,
      input: parsedBody.data,
      adminUserId: auth.userId,
    });

    if (!question) {
      return NextResponse.json(
        { error: "Speaking topic or question not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ question }, { headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: getSafeErrorMessage(error), error },
      {
        fallback: "Failed to update Speaking question.",
        status: getErrorStatus(error, 500),
        context: "admin_speaking_question_update_failed",
      },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }

  const params = await context.params;
  const parsedParams = questionParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid Speaking question path." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const deleted = await deleteAdminSpeakingQuestion({
      topicId: parsedParams.data.topicId,
      questionId: parsedParams.data.questionId,
      adminUserId: auth.userId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Speaking topic or question not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: getSafeErrorMessage(error), error },
      {
        fallback: "Failed to delete Speaking question.",
        status: getErrorStatus(error, 500),
        context: "admin_speaking_question_delete_failed",
      },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

function getErrorStatus(error: unknown, fallback: number) {
  return error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status) || fallback
    : fallback;
}

function getSafeErrorMessage(error: unknown) {
  return error && typeof error === "object" && "safeMessage" in error
    ? String((error as { safeMessage?: unknown }).safeMessage || "")
    : undefined;
}
