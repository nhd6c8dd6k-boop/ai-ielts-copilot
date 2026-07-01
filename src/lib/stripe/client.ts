import Stripe from "stripe";

import { env, requireEnv } from "@/lib/env";

export function createStripeClient() {
  return new Stripe(requireEnv(env.stripeSecretKey, "STRIPE_SECRET_KEY"), {
    appInfo: {
      name: "AI IELTS Copilot",
    },
  });
}
