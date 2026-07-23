import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPublishedSpeakingQuestionById,
  getSpeakingUsageSummary,
} from "@/server/services/speaking-practice";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const questionParamsSchema = z.object({
  questionId: z.string().uuid(),
});

type RouteProps = {
  params: Promise<{
    questionId: string;
  }>;
};

type UnlockRpcRow = {
  allowed: boolean;
  already_unlocked: boolean;
  used_today: number;
  limit_today: number;
  remaining_today: number;
  reason: string;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const parsed = questionParamsSchema.safeParse(await params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Speaking question id." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Speaking practice is not configured." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "login_required",
        message: "Sign in to practise Speaking questions.",
        loginUrl: "/login",
        registerUrl: "/register",
      },
      { status: 401, headers: noStoreHeaders },
    );
  }

  const usageBeforeUnlock = await getSpeakingUsageSummary(user.id);

  if (!usageBeforeUnlock.isUnlimited) {
    const { data, error } = await supabase
      .rpc("unlock_speaking_question", {
        p_question_id: parsed.data.questionId,
      })
      .single();

    if (error) {
      return NextResponse.json(
        { error: "speaking_unlock_failed" },
        { status: 500, headers: noStoreHeaders },
      );
    }

    const unlock = data as UnlockRpcRow | null;

    if (!unlock?.allowed) {
      const status = unlock?.reason === "not_found" ? 404 : 402;

      return NextResponse.json(
        {
          error:
            unlock?.reason === "not_found"
              ? "speaking_question_not_found"
              : "speaking_limit_reached",
          message:
            unlock?.reason === "not_found"
              ? "Speaking question not found."
              : "You've reached today's free Speaking limit.",
          usage: {
            ...usageBeforeUnlock,
            usedToday: unlock?.used_today ?? usageBeforeUnlock.usedToday,
            remainingToday:
              unlock?.remaining_today ?? usageBeforeUnlock.remainingToday,
          },
          upgradeUrl: "/pricing",
        },
        { status, headers: noStoreHeaders },
      );
    }
  }

  const question = await getPublishedSpeakingQuestionById(parsed.data.questionId);

  if (!question) {
    return NextResponse.json(
      { error: "speaking_question_not_found" },
      { status: 404, headers: noStoreHeaders },
    );
  }

  const usage = await getSpeakingUsageSummary(user.id);

  return NextResponse.json(
    {
      question,
      usage,
    },
    { headers: noStoreHeaders },
  );
}
