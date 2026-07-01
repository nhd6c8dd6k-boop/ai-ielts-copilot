import { env } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe/client";

export async function createCheckoutSession({
  userId,
  email,
  plan,
}: {
  userId: string;
  email?: string;
  plan: "pro_monthly" | "pro_yearly";
}) {
  const stripe = createStripeClient();
  const price =
    plan === "pro_monthly"
      ? env.stripeProMonthlyPriceId
      : env.stripeProYearlyPriceId;

  if (!price) {
    throw new Error(`Missing Stripe price for plan: ${plan}`);
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: userId,
    customer_email: email,
    line_items: [{ price, quantity: 1 }],
    success_url: `${env.nextPublicSiteUrl}/dashboard?checkout=success`,
    cancel_url: `${env.nextPublicSiteUrl}/pricing?checkout=cancelled`,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });
}
