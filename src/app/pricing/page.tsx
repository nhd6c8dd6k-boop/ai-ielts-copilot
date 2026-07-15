import Link from "next/link";
import { Check, Crown, ShieldCheck } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  ["pricing.feature.reading", "Complete any 5 different Reading practice sets"],
  ["pricing.feature.listening", "Complete any 5 different Listening practice sets"],
  ["pricing.feature.writing", "1 AI Writing feedback per day"],
  ["pricing.feature.repeat", "Repeat completed sets without using another slot"],
  ["pricing.feature.dashboard", "Basic practice history"],
];

const proFeatures = [
  ["pricing.pro.feature.membership", "Unlimited Reading practice"],
  [
    "pricing.pro.feature.support",
    "Unlimited Listening practice",
  ],
  [
    "pricing.pro.feature.writing",
    "Up to 10 AI Writing feedbacks per day",
  ],
  [
    "pricing.pro.feature.future",
    "Priority access to future advanced features",
  ],
  [
    "pricing.pro.feature.manual",
    "Manually activated using your registered email",
  ],
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge>
            <LocalizedText k="pricing.eyebrow" fallback="Free / Pro" />
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            <LocalizedText k="pricing.title" fallback="Free and Pro plans" />
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            <LocalizedText
              k="pricing.description"
              fallback="Start IELTS practice for free. Pro membership is manually activated using your registered email."
            />
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
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
                    fallback="Create a free account and start practising Reading, Listening, and Writing."
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

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
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

            <Button asChild className="mt-8">
              <Link href="/practice/writing">
                <LocalizedText
                  k="pricing.startPracticing"
                  fallback="Start practising for free"
                />
              </Link>
            </Button>
          </section>

          <section className="rounded-lg border border-teal-200 bg-[#fbfbf8] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-teal-800">
              <Crown className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              <LocalizedText k="pricing.proPlan" fallback="Pro" />
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              <LocalizedText
                k="pricing.proBody"
                fallback="Support the project and receive Pro membership with access to future Pro features. Pro is manually activated after payment confirmation."
              />
            </p>
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
            <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <LocalizedText
                k="pricing.betaReward"
                fallback="The first 10 users who register and complete a practice will receive one month of Pro access. Eligible users will be activated manually."
              />
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/support">
                <LocalizedText
                  k="pricing.contactUpgrade"
                  fallback="Contact to upgrade"
                />
              </Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
