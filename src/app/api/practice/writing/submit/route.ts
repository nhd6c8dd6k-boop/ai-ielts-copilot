import { NextResponse } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  submitWritingPractice,
  submitWritingPracticeSchema,
} from "@/server/services/writing-practice";
import {
  checkAiUsageLimit,
  recordAiUsage,
} from "@/server/services/usage-limits";
import { apiErrorResponse } from "@/server/utils/api-error";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is required for Writing AI feedback." },
      { status: 500 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后提交作文。" }, { status: 401 });
  }

  if (!env.openaiApiKey) {
    return NextResponse.json(
      {
        error:
          "AI Writing feedback is not available yet. OPENAI_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  const usage = await checkAiUsageLimit("writing_grade");

  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: usage.message,
        limit: usage.limit,
        used: usage.used,
        plan: usage.plan,
      },
      { status: usage.status },
    );
  }

  try {
    const input = submitWritingPracticeSchema.parse(await request.json());
    const result = await submitWritingPractice({
      userId: user.id,
      writingTaskId: input.writingTaskId,
      essay: input.essay,
      language: input.language,
      timeSpentSeconds: input.timeSpentSeconds,
    });

    await recordAiUsage({
      feature: "writing_grade",
      userId: user.id,
      model: result.usage.model,
      status: "success",
    });

    return NextResponse.json({
      attemptId: result.attemptId,
      overallBand: result.overallBand,
    });
  } catch (error) {
    await recordAiUsage({
      feature: "writing_grade",
      userId: user.id,
      model: "gpt-5.2",
      status: "error",
      errorMessage:
        error instanceof Error ? error.message : "Writing feedback failed.",
    });

    if (isUserFacingWritingError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return apiErrorResponse(error, {
      fallback: "Writing feedback failed.",
      status: 400,
      context: "writing_submit_failed",
    });
  }
}

function isUserFacingWritingError(error: unknown): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.startsWith("Please write at least") ||
    error.message === "Writing task not found or not published."
  );
}
