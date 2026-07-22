import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAdminSpeakingTopicMetadata,
  getAdminSpeakingTopicSummaries,
  type AdminSpeakingTopicFilters,
} from "@/server/services/admin-speaking";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const topicFiltersSchema = z.object({
  part: z
    .enum(["1", "2", "3"])
    .transform((value) => Number(value) as AdminSpeakingTopicFilters["part"])
    .optional(),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
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

export async function GET(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = topicFiltersSchema.safeParse({
    part: getOptionalQueryValue(url, "part"),
    status: getOptionalQueryValue(url, "status"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Speaking topic filters." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const topics = await getAdminSpeakingTopicSummaries(parsed.data);

    return NextResponse.json({ topics }, { headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: "Failed to load Speaking topics.", error },
      {
        fallback: "Failed to load Speaking topics.",
        status: 500,
        context: "admin_speaking_topics_load_failed",
      },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", "no-store");
    return auth.response;
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

  const parsed = topicMetadataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Speaking topic metadata." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const topic = await createAdminSpeakingTopicMetadata({
      input: parsed.data,
      adminUserId: auth.userId,
    });

    return NextResponse.json({ topic }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    const response = apiErrorResponse(
      { safeMessage: getSafeErrorMessage(error), error },
      {
        fallback: "Failed to create Speaking topic.",
        status: getErrorStatus(error, 500),
        context: "admin_speaking_topic_create_failed",
      },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

function getOptionalQueryValue(url: URL, key: string) {
  return url.searchParams.has(key) ? url.searchParams.get(key) : undefined;
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
