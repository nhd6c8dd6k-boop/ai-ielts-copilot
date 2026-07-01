import { NextResponse } from "next/server";
import Stripe from "stripe";

import { env, isSupabaseConfigured } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SubscriptionPlan = "free" | "pro_monthly" | "pro_yearly";
type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export async function POST(request: Request) {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  if (!isSupabaseConfigured() || !env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase admin credentials are not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = createStripeClient();
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripeWebhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await recordInvoicePayment(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe webhook failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = parsePlan(session.metadata?.plan);
  const subscriptionId = getStripeId(session.subscription);

  if (!userId || !subscriptionId) {
    return;
  }

  const stripe = createStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertSubscription(subscription, {
    fallbackUserId: userId,
    fallbackPlan: plan,
  });
}

async function upsertSubscription(
  subscription: Stripe.Subscription,
  fallback?: {
    fallbackUserId?: string;
    fallbackPlan?: SubscriptionPlan;
  },
) {
  const userId = subscription.metadata.userId ?? fallback?.fallbackUserId;

  if (!userId) {
    return;
  }

  const plan =
    parsePlan(subscription.metadata.plan) ??
    fallback?.fallbackPlan ??
    planFromPriceId(subscription.items.data[0]?.price.id) ??
    "free";
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: getStripeId(subscription.customer),
      stripe_subscription_id: subscription.id,
      plan,
      status: mapSubscriptionStatus(subscription.status),
      current_period_end: unixToIso(
        subscription.items.data[0]?.current_period_end,
      ),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function recordInvoicePayment(invoice: Stripe.Invoice) {
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = getStripeId(subscriptionDetails?.subscription);
  const userId =
    (subscriptionId ? await findUserIdBySubscription(subscriptionId) : null) ??
    subscriptionDetails?.metadata?.userId ??
    invoice.metadata?.userId;
  const paymentIntentId = getStripeId(
    invoice.payments?.data[0]?.payment.payment_intent,
  );

  if (!userId) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("payments").upsert(
    {
      user_id: userId,
      provider: "stripe",
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_payment_intent_id: paymentIntentId,
      amount: invoice.amount_paid || invoice.amount_due || 0,
      currency: invoice.currency ?? "usd",
      status: invoice.status ?? "unknown",
      paid_at: invoice.status === "paid" ? new Date().toISOString() : null,
    },
    { onConflict: "stripe_invoice_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function findUserIdBySubscription(subscriptionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.user_id ?? null;
}

function parsePlan(plan: string | undefined): SubscriptionPlan | undefined {
  if (plan === "pro_monthly" || plan === "pro_yearly" || plan === "free") {
    return plan;
  }

  return undefined;
}

function planFromPriceId(priceId: string | undefined): SubscriptionPlan | null {
  if (!priceId) {
    return null;
  }

  if (priceId === env.stripeProMonthlyPriceId) {
    return "pro_monthly";
  }

  if (priceId === env.stripeProYearlyPriceId) {
    return "pro_yearly";
  }

  return null;
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "incomplete"
  ) {
    return status;
  }

  return "canceled";
}

function unixToIso(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function getStripeId(value: string | { id?: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id ?? null;
}
