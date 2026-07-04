import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiErrorResponse } from "@/server/utils/api-error";

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
    return apiErrorResponse(error, {
      fallback: "Failed to load practice history.",
      status: 400,
      context: "practice_history_load_failed",
    });
  }

  return NextResponse.json({ mode: "supabase", history: data });
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy practice history submission is disabled. Use official practice submit APIs.",
    },
    { status: 410 },
  );
}
