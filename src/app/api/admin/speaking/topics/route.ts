import { NextResponse } from "next/server";
import { z } from "zod";

import {
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

function getOptionalQueryValue(url: URL, key: string) {
  return url.searchParams.has(key) ? url.searchParams.get(key) : undefined;
}
