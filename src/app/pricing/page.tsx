import Link from "next/link";
import type { Metadata } from "next";
import {
  Check,
  Clock3,
  Crown,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { ManualPaymentMethods } from "@/components/payments/manual-payment-methods";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { proPricing } from "@/config/pricing";
import { ContactToUpgradeButton } from "@/features/payments/contact-to-upgrade-button";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI IELTS Copilot Pro Pricing",
  description:
    "Compare AI IELTS Copilot Free, Pro Monthly, and Pro Yearly membership options for IELTS practice and AI Writing feedback.",
  alternates: {
    canonical: absoluteUrl("/pricing"),
  },
};

const freeFeatures = [
  ["pricing.feature.reading", "Complete any 5 different Reading practice sets"],
  [
    "pricing.feature.listening",
    "Complete any 5 different Listening practice sets",
  ],
  ["pricing.feature.writing", "1 AI Writing feedback per day"],
  [
    "pricing.feature.speaking",
    "Speaking Preparation Library with sample answers",
  ],
  ["pricing.feature.repeat", "Repeat completed sets without using another slot"],
  ["pricing.feature.dashboard", "Basic practice history"],
];

const proFeatures = [
  ["pricing.pro.feature.reading", "Unlimited Reading practice"],
  ["pricing.pro.feature.listening", "Unlimited Listening practice"],
  ["pricing.pro.feature.writing", "Up to 10 AI Writing feedbacks per day"],
  [
    "pricing.pro.feature.speaking",
    "Speaking Preparation Library with Band 6–8 sample answers",
  ],
  [
    "pricing.pro.feature.manual",
    "Manually activated using your registered email",
  ],
];

const steps = [
  ["pricing.how.step.choose", "Choose Monthly or Yearly Pro"],
  ["pricing.how.step.chat", "Contact us through live chat"],
  [
    "pricing.how.step.confirm",
    "Complete payment and send confirmation",
  ],
];

const faqs = [
  [
    "pricing.faq.price.q",
    "How much is Pro?",
    "pricing.faq.price.a",
    "Monthly Pro is CA$9.99/month. Yearly Pro is CA$79.99/year, about CA$6.67/month and 33% less than paying monthly for 12 months.",
  ],
  [
    "pricing.faq.pay.q",
    "How do I pay?",
    "pricing.faq.pay.a",
    "Use WeChat Pay, Alipay, PayPal, or Interac e-Transfer. Contact us in live chat for payment details.",
  ],
  [
    "pricing.faq.activate.q",
    "How is Pro activated?",
    "pricing.faq.activate.a",
    "After payment is confirmed, your account is upgraded manually.",
  ],
  [
    "pricing.faq.account.q",
    "Do I need to create a new account?",
    "pricing.faq.account.a",
    "No. Use the same email/account you use on AI IELTS Copilot.",
  ],
  [
    "pricing.faq.cancel.q",
    "Can I cancel?",
    "pricing.faq.cancel.a",
    "Because this is currently a manual payment system, there is no automatic recurring charge unless the current payment method explicitly creates one.",
  ],
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 pb-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge>
            <LocalizedText k="pricing.eyebrow" fallback="Free / Pro" />
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            <LocalizedText k="pricing.title" fallback="Choose your plan" />
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            <LocalizedText
              k="pricing.description"
              fallback="Get more IELTS practice, higher usage limits, and full access to AI Writing feedback."
            />
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  <LocalizedText
                    k="pricing.availableNow"
                    fallback="Available now"
                  />
                </Badge>
                <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                  <LocalizedText k="pricing.freePlan" fallback="Free" />
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <LocalizedText
                    k="pricing.freeBody"
                    fallback="Create a free account and start practising Reading, Listening, Writing, and Speaking preparation."
                  />
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-tight text-slate-950">
                  ¥0
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  <LocalizedText k="pricing.freePrice" fallback="free access" />
                </div>
              </div>
            </div>

            <ul className="mt-8 grid gap-3">
              {freeFeatures.map(([key, fallback]) => (
                <li key={key} className="flex gap-3 text-sm text-slate-600">
                  <Check
                    className="mt-0.5 h-4 w-4 text-teal-700"
                    aria-hidden="true"
                  />
                  <LocalizedText k={key} fallback={fallback} />
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8 w-full">
              <Link href="/practice/writing">
                <LocalizedText
                  k="pricing.startPracticing"
                  fallback="Start practising for free"
                />
              </Link>
            </Button>
          </section>

          <ProPlanCard
            plan="monthly"
            badgeKey="pricing.monthly.badge"
            badgeFallback="Most flexible"
            titleKey="pricing.monthly.title"
            titleFallback="Pro Monthly"
            bodyKey="pricing.monthly.body"
            bodyFallback="Monthly Pro access with manual activation after payment confirmation."
            price={proPricing.monthly.display}
            subPriceKey="pricing.proPriceRmb"
            subPriceFallback={proPricing.monthly.rmbEstimate}
            noteKey="pricing.monthly.note"
            noteFallback="Monthly access. Renewal is handled manually through support."
          />

          <ProPlanCard
            plan="yearly"
            badgeKey="pricing.yearly.badge"
            badgeFallback="Yearly option"
            titleKey="pricing.yearly.title"
            titleFallback="Pro Yearly"
            bodyKey="pricing.yearly.body"
            bodyFallback="Yearly Pro access for learners who want a longer practice period."
            price={proPricing.yearly.display}
            subPriceKey="pricing.yearly.monthlyEquivalent"
            subPriceFallback={proPricing.yearly.monthlyEquivalent}
            highlightKey="pricing.yearly.save"
            highlightFallback={proPricing.yearly.savingsPercent}
            noteKey="pricing.yearly.note"
            noteFallback="Approximate local payment amount will be confirmed in live chat."
          />
        </div>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3 text-2xl">
                <LocalizedText
                  k="pricing.how.title"
                  fallback="How manual Pro activation works"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3">
                {steps.map(([key, fallback], index) => (
                  <li
                    key={key}
                    className="flex gap-3 text-sm leading-6 text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <LocalizedText k={key} fallback={fallback} />
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="pricing.manualActivationNote"
                  fallback="After payment is confirmed, Pro will be manually activated using your registered email."
                />
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                <LocalizedText
                  k="pricing.activationTiming"
                  fallback="We’ll activate your membership as soon as the payment is confirmed."
                />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3 text-2xl">
                <LocalizedText
                  k="pricing.confirmation.title"
                  fallback="Payment confirmation"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                <LocalizedText
                  k="pricing.confirmation.body"
                  fallback="After payment, send your payment screenshot, PayPal transaction ID, e-Transfer sender name, or payment reference in live chat."
                />
              </p>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <LocalizedText
                  k="pricing.confirmation.security"
                  fallback="Do not send passwords, card numbers, bank login details, or authentication codes."
                />
              </p>
            </CardContent>
          </Card>
        </section>

        <ManualPaymentMethods />

        <section className="mt-12">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              <LocalizedText k="pricing.faq.title" fallback="FAQ" />
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqs.map(([questionKey, question, answerKey, answer]) => (
              <Card key={questionKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <LocalizedText k={questionKey} fallback={question} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">
                    <LocalizedText k={answerKey} fallback={answer} />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ProPlanCard({
  plan,
  badgeKey,
  badgeFallback,
  titleKey,
  titleFallback,
  bodyKey,
  bodyFallback,
  price,
  subPriceKey,
  subPriceFallback,
  highlightKey,
  highlightFallback,
  noteKey,
  noteFallback,
}: {
  plan: "monthly" | "yearly";
  badgeKey: string;
  badgeFallback: string;
  titleKey: string;
  titleFallback: string;
  bodyKey: string;
  bodyFallback: string;
  price: string;
  subPriceKey: string;
  subPriceFallback: string;
  highlightKey?: string;
  highlightFallback?: string;
  noteKey: string;
  noteFallback: string;
}) {
  return (
    <section className="rounded-lg border border-teal-200 bg-[#fbfbf8] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-teal-800 shadow-sm ring-1 ring-teal-100">
        <Crown className="h-5 w-5" aria-hidden="true" />
      </div>
      <Badge className="mt-5 border-teal-200 bg-teal-50 text-teal-900">
        <LocalizedText k={badgeKey} fallback={badgeFallback} />
      </Badge>
      <h2 className="mt-4 text-2xl font-semibold text-slate-950">
        <LocalizedText k={titleKey} fallback={titleFallback} />
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        <LocalizedText k={bodyKey} fallback={bodyFallback} />
      </p>
      <div className="mt-5 rounded-md border border-teal-200 bg-white px-4 py-4">
        <p className="text-3xl font-semibold tracking-tight text-slate-950">
          {price}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-teal-800">
            <LocalizedText k={subPriceKey} fallback={subPriceFallback} />
          </p>
          {highlightKey ? (
            <Badge className="border-teal-200 bg-teal-50 text-teal-900">
              <LocalizedText
                k={highlightKey}
                fallback={highlightFallback ?? "Save 33%"}
              />
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          <LocalizedText k={noteKey} fallback={noteFallback} />
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {proFeatures.map(([key, fallback]) => (
          <li key={key} className="flex gap-3 text-sm text-slate-600">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 text-teal-700"
              aria-hidden="true"
            />
            <LocalizedText k={key} fallback={fallback} />
          </li>
        ))}
      </ul>
      <ContactToUpgradeButton plan={plan} className="mt-6 w-full" />
      <p className="mt-3 text-xs leading-5 text-slate-500">
        <LocalizedText
          k="pricing.noAutoActivation"
          fallback="This button opens live chat. It does not automatically activate Pro or start Stripe Checkout."
        />
      </p>
    </section>
  );
}
