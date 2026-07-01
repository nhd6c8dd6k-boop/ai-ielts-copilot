import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "demo", user: null });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "anonymous", user: null });
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan,status,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    mode: "supabase",
    user: {
      id: user.id,
      email: user.email,
      displayName: profile?.display_name ?? user.email ?? "IELTS Candidate",
      role: profile?.role ?? "student",
      plan: subscription?.plan ?? "free",
      subscriptionStatus: subscription?.status ?? "active",
      currentPeriodEnd: subscription?.current_period_end ?? null,
    },
  });
}
