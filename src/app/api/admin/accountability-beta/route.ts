import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  activateWaitlistedAccountabilityUser,
  getAdminAccountabilityParticipants,
  logAccountabilityAdminAction,
  markAccountabilityReminderSent,
} from "@/server/services/accountability-beta";
import { requireAdminUser } from "@/server/services/admin-auth";

const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("activate_waitlisted"),
    enrollmentId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("mark_reminder_sent"),
    enrollmentId: z.string().uuid(),
    channel: z.enum(["crisp", "email", "none"]).default("crisp"),
  }),
]);

export async function GET() {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const participants = await getAdminAccountabilityParticipants(
    createSupabaseAdminClient(),
  );

  return NextResponse.json({ participants });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = adminActionSchema.safeParse(await request.json());

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid admin action.", issues: input.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    if (input.data.action === "activate_waitlisted") {
      await activateWaitlistedAccountabilityUser(admin, input.data.enrollmentId);
      await logAccountabilityAdminAction(
        admin,
        auth.userId,
        "accountability_beta_waitlist_activated",
        input.data.enrollmentId,
      );
    } else {
      await markAccountabilityReminderSent(
        admin,
        input.data.enrollmentId,
        auth.userId,
        input.data.channel,
      );
      await logAccountabilityAdminAction(
        admin,
        auth.userId,
        "accountability_reminder_marked_sent",
        input.data.enrollmentId,
        { channel: input.data.channel },
      );
    }

    const participants = await getAdminAccountabilityParticipants(admin);

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin action failed." },
      { status: 400 },
    );
  }
}
