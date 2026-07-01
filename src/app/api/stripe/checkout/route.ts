import { NextResponse } from "next/server";
import { z } from "zod";

import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/server/services/subscriptions";

const checkoutInputSchema = z.object({
  plan: z.union([z.literal("pro_monthly"), z.literal("pro_yearly")]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const input = checkoutInputSchema.parse(body);

  // Backward-compatible endpoint. New UI uses /api/payments/checkout.
  if (!env.stripeSecretKey) {
    return NextResponse.json({
      mode: "demo",
      url: `/dashboard?checkout=demo&plan=${input.plan}`,
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      mode: "demo",
      url: `/dashboard?checkout=demo&plan=${input.plan}`,
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before starting checkout." },
      { status: 401 },
    );
  }

  const session = await createCheckoutSession({
    userId: user.id,
    email: user.email,
    plan: input.plan,
  });

  return NextResponse.json({
    mode: "stripe",
    url: session.url,
  });
}
