import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  accountabilityFeedbackSchema,
  accountabilityJoinSchema,
  completeAccountabilityTask,
  getAccountabilityBetaState,
  joinAccountabilityBeta,
  submitAccountabilityFeedback,
  withdrawAccountabilityEnrollment,
} from "@/server/services/accountability-beta";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete_task"),
    taskId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("withdraw"),
  }),
  z.object({
    action: z.literal("feedback"),
    feedback: accountabilityFeedbackSchema,
  }),
]);

export async function GET() {
  const auth = await getAuthenticatedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const admin = createSupabaseAdminClient();
  const state = await getAccountabilityBetaState(admin, auth.user.id);

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = accountabilityJoinSchema.safeParse(await request.json());

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid onboarding input.", issues: input.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const enrollment = await joinAccountabilityBeta(
      createSupabaseAdminClient(),
      auth.user.id,
      input.data,
    );

    return NextResponse.json({ enabled: true, enrollment });
  } catch (error) {
    return NextResponse.json(
      { error: getSafeErrorMessage(error) },
      { status: getSafeErrorMessage(error) === "accountability_beta_disabled" ? 404 : 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = actionSchema.safeParse(await request.json());

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid accountability action.", issues: input.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    if (input.data.action === "complete_task") {
      const enrollment = await completeAccountabilityTask(
        admin,
        auth.user.id,
        input.data.taskId,
      );

      return NextResponse.json({ enabled: true, enrollment });
    }

    if (input.data.action === "withdraw") {
      const enrollment = await withdrawAccountabilityEnrollment(
        admin,
        auth.user.id,
      );

      return NextResponse.json({ enabled: true, enrollment });
    }

    const enrollment = await submitAccountabilityFeedback(
      admin,
      auth.user.id,
      input.data.feedback,
    );

    return NextResponse.json({ enabled: true, enrollment });
  } catch (error) {
    const message = getSafeErrorMessage(error);
    const status = message.includes("locked")
      ? 403
      : message.includes("not_found")
        ? 404
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Supabase is required for Accountability Beta." },
        { status: 500 },
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true as const, user };
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "accountability_beta_error";
}
