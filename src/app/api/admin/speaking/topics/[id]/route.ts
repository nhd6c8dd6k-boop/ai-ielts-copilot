import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSpeakingTopicDetailById } from "@/server/services/admin-speaking";
import { requireAdminUser } from "@/server/services/admin-auth";
import { apiErrorResponse } from "@/server/utils/api-error";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const topicParamsSchema = z.object({
  id: z.string().uuid(),
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
