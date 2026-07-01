import { NextResponse } from "next/server";
import { z } from "zod";

import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/server/services/subscriptions";

const checkoutInputSchema = z.object({
  plan: z.union([z.literal("pro_monthly"), z.literal("pro_yearly")]),
  channel: z.union([
    z.literal("wechat"),
    z.literal("alipay"),
    z.literal("apple_pay"),
    z.literal("stripe"),
  ]),
});

const domesticCheckoutLabels = {
  wechat: "微信支付",
  alipay: "支付宝",
};

export async function POST(request: Request) {
  const body = await request.json();
  const input = checkoutInputSchema.parse(body);

  if (input.channel === "stripe" || input.channel === "apple_pay") {
    if (!env.stripeSecretKey) {
      return NextResponse.json({
        mode: "demo",
        provider: input.channel === "apple_pay" ? "Apple Pay" : "Stripe",
        url: `/dashboard?checkout=demo&provider=${input.channel}&plan=${input.plan}`,
      });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        mode: "demo",
        provider: input.channel === "apple_pay" ? "Apple Pay" : "Stripe",
        url: `/dashboard?checkout=demo&provider=${input.channel}&plan=${input.plan}`,
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
      provider: input.channel === "apple_pay" ? "Apple Pay" : "Stripe",
      url: session.url,
    });
  }

  return NextResponse.json({
    mode: "demo",
    provider: domesticCheckoutLabels[input.channel],
    url: `/dashboard?checkout=demo&provider=${input.channel}&plan=${input.plan}`,
  });
}
