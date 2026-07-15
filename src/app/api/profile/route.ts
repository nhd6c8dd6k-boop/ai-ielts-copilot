import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProSubscription } from "@/server/services/memberships";
import { getUserPracticeUsage } from "@/server/services/usage-limits";
import { apiErrorResponse } from "@/server/utils/api-error";

const profileInputSchema = z.object({
  displayName: z.string().optional(),
  targetBand: z.string().optional(),
  examDate: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", profile: null });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "anonymous", profile: null });
  }

  const [profileResult, subscriptionResult, usage] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,target_band,exam_date,country,timezone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan,status,started_at,expires_at,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    getUserPracticeUsage(user.id),
  ]);

  if (profileResult.error) {
    return apiErrorResponse(profileResult.error, {
      fallback: "Failed to load profile.",
      status: 400,
      context: "profile_load_failed",
    });
  }

  const subscription = subscriptionResult.data;

  return NextResponse.json({
    mode: "supabase",
    profile: profileResult.data,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          started_at: subscription.started_at,
          expires_at:
            subscription.expires_at ?? subscription.current_period_end ?? null,
          is_pro: isProSubscription(subscription),
        }
      : null,
    usage,
  });
}

export async function PUT(request: Request) {
  const input = profileInputSchema.parse(await request.json());

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", profile: input });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      target_band: input.targetBand ? Number(input.targetBand) : null,
      exam_date: input.examDate || null,
      country: input.country,
      timezone: input.timezone,
    })
    .eq("id", user.id)
    .select("display_name,target_band,exam_date,country,timezone")
    .single();

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to update profile.",
      status: 400,
      context: "profile_update_failed",
    });
  }

  return NextResponse.json({ mode: "supabase", profile: data });
}
