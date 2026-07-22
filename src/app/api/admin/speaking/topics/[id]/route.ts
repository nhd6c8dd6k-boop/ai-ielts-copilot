import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAdminSpeakingTopicDetailById,
  updateAdminSpeakingTopicMetadata,
} from "@/server/services/admin-speaking";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const topicParamsSchema = z.object({
  id: z.string().uuid(),
});

const topicMetadataSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .refine((value) => !value.includes("--"))
    .refine((value) => !value.startsWith("-") && !value.endsWith("-")),
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  description: z.string().trim().max(600),
  targetBand: z.union([
    z.literal(5),
    z.literal(5.5),
    z.literal(6),
    z.literal(6.5),
    z.literal(7),
    z.literal(7.5),
    z.literal(8),
    z.literal(8.5),
    z.literal(9),
  ]),
  sourceType: z.enum(["manual", "ai"]),
  status: z.enum(["draft", "review", "published", "archived"]),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }

  const params = await context.params;
  const parsed = topicParamsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Speaking topic id." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const topic = await getAdminSpeakingTopicDetailById(parsed.data.id);

    if (!topic) {
      return NextResponse.json(
        { error: "Speaking topic not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ topic }, { headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: "Failed to load Speaking topic.", error },
      {
        fallback: "Failed to load Speaking topic.",
        status: 500,
        context: "admin_speaking_topic_load_failed",
      },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }

  const params = await context.params;
  const parsedParams = topicParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Invalid Speaking topic id." },
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

  const parsedBody = topicMetadataSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid Speaking topic metadata." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const topic = await updateAdminSpeakingTopicMetadata({
      id: parsedParams.data.id,
      input: parsedBody.data,
      adminUserId: auth.userId,
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Speaking topic not found." },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ topic }, { headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: getSafeErrorMessage(error), error },
      {
        fallback: "Failed to update Speaking topic.",
        status: getErrorStatus(error, 500),
        context: "admin_speaking_topic_update_failed",
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
