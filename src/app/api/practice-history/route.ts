import { NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const practiceHistoryInputSchema = z.object({
  skill: z.enum(["reading", "listening", "writing"]),
  setType: z.string().default("demo"),
  setId: z.string().uuid().optional(),
  title: z.string().optional(),
  scoreLabel: z.string().optional(),
  score: z.number().optional(),
  bandEstimate: z.number().optional(),
  accuracy: z.number().optional(),
  detail: z.string().optional(),
  weakAreas: z.array(z.string()).default([]),
  nextAction: z.string().optional(),
  timeSpentSeconds: z.number().int().nonnegative().default(0),
  answers: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", history: [] });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "anonymous", history: [] });
  }

  const { data, error } = await supabase
    .from("practice_history")
    .select(
      "id,skill,content_type,content_id,set_type,set_id,title,score_label,score,band_estimate,accuracy,total_questions,correct_count,detail,weak_areas,next_action,time_spent_seconds,answers,submitted_at",
    )
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ mode: "supabase", history: data });
}

export async function POST(request: Request) {
  const input = practiceHistoryInputSchema.parse(await request.json());

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", historyItem: input });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("practice_history")
    .insert({
      user_id: user.id,
      skill: input.skill,
      set_type: input.setType,
      set_id: input.setId ?? null,
      title: input.title ?? null,
      score_label: input.scoreLabel ?? null,
      score: input.score ?? null,
      band_estimate: input.bandEstimate ?? null,
      accuracy: input.accuracy ?? null,
      detail: input.detail ?? null,
      weak_areas: input.weakAreas,
      next_action: input.nextAction ?? null,
      time_spent_seconds: input.timeSpentSeconds,
      answers: input.answers,
    })
    .select(
      "id,skill,content_type,content_id,set_type,set_id,title,score_label,score,band_estimate,accuracy,total_questions,correct_count,detail,weak_areas,next_action,time_spent_seconds,answers,submitted_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ mode: "supabase", historyItem: data });
}
