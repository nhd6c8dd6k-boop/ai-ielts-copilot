import Link from "next/link";
import { Check, Clock, ShieldCheck } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const betaFeatures = [
  ["pricing.feature.reading", "Reading practice with automatic scoring"],
  ["pricing.feature.listening", "Listening audio practice with automatic scoring"],
  ["pricing.feature.writing", "Writing Task 1 / Task 2 with AI feedback"],
  ["pricing.feature.dashboard", "Dashboard progress tracking"],
];

const plannedFeatures = [
  ["pricing.planned.moreSets", "More published practice sets"],
  ["pricing.planned.proPlans", "Pro plans and usage limits"],
  ["pricing.planned.paidLater", "Paid plans may be added after beta testing"],
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge>
            <LocalizedText k="pricing.betaAccess" fallback="Beta Access" />
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            <LocalizedText k="pricing.free" fallback="Free during beta" />
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            <LocalizedText
              k="pricing.description"
              fallback="AI IELTS Copilot is free during beta while we improve the practice experience with early users."
            />
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
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
                  <LocalizedText
                    k="pricing.betaAccess"
                    fallback="Beta Access"
                  />
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <LocalizedText
                    k="pricing.betaBody"
                    fallback="Use the current beta product while the practice experience is being tested and improved."
                  />
                </p>
                <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  <LocalizedText
                    k="pricing.betaReward"
                    fallback="Beta tester reward: The first 10 users who sign up and complete one practice session will receive 1 month of Pro access when paid plans launch."
                  />
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-tight text-slate-950">
                  ¥0
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  <LocalizedText k="pricing.duringBeta" fallback="during beta" />
                </div>
              </div>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {betaFeatures.map(([key, fallback]) => (
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
              <Link href="/practice">
                <LocalizedText
                  k="pricing.startPracticing"
                  fallback="Start practicing"
                />
              </Link>
            </Button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-[#fbfbf8] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-700">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              <LocalizedText
                k="pricing.proInactive"
                fallback="Pro plans are not active during beta"
              />
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              <LocalizedText
                k="pricing.proInactiveBody"
                fallback="Paid plans may be added after beta testing. Payment options are intentionally disabled for now, so there are no checkout buttons."
              />
            </p>
            <ul className="mt-6 space-y-3">
              {plannedFeatures.map(([key, fallback]) => (
                <li key={key} className="flex gap-3 text-sm text-slate-600">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <LocalizedText k={key} fallback={fallback} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
