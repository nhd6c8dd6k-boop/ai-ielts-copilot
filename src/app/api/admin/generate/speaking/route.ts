import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { requireAdminUser } from "@/server/services/admin-auth";
import {
  adminGenerateSpeakingInputSchema,
  generateAdminSpeakingContent,
} from "@/server/services/admin-ai-content";
import { apiErrorResponse } from "@/server/utils/api-error";

export async function POST(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  if (!env.openaiApiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required for admin generation." },
      { status: 500 },
    );
  }

  try {
    const input = adminGenerateSpeakingInputSchema.parse(await request.json());
    const result = await generateAdminSpeakingContent({
      adminUserId: auth.userId,
      input,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, {
      fallback: "Speaking generation failed.",
      status: 400,
      context: "admin_speaking_generation_failed",
    });
  }
}
