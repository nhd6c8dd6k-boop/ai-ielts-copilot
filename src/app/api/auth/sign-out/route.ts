import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiErrorResponse } from "@/server/utils/api-error";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", ok: true });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to sign out.",
      status: 400,
      context: "auth_sign_out_failed",
    });
  }

  return NextResponse.json({ mode: "supabase", ok: true });
}
