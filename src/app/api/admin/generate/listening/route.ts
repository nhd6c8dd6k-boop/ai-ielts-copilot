import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { requireAdminUser } from "@/server/services/admin-auth";
import {
  adminGenerateListeningInputSchema,
  generateAdminListeningContent,
} from "@/server/services/admin-ai-content";

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
    const input = adminGenerateListeningInputSchema.parse(await request.json());
    const result = await generateAdminListeningContent({
      adminUserId: auth.userId,
      input,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Listening generation failed.",
      },
      { status: 400 },
    );
  }
}
