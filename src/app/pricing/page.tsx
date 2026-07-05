import Link from "next/link";
import { Check, Clock, ShieldCheck } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const betaFeatures = [
  "Reading practice with automatic scoring",
  "Listening audio practice with automatic scoring",
  "Writing AI feedback with browser draft saving",
  "Dashboard progress tracking",
];

const plannedFeatures = [
  "More published practice sets",
  "Pro plans and usage limits",
  "Domestic payment options after beta",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge>Beta pricing</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Free during beta
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            AI IELTS Copilot is currently open for early testing. Reading and
            Listening practice are available now, and Writing AI feedback is
            available for beta testing. Paid Pro plans are not active during
            this beta stage, so there are no payment buttons.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  Available now
                </Badge>
                <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                  Beta Access
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the current MVP while the product is being tested with
                  early users.
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-semibold tracking-tight text-slate-950">
                  ¥0
                </div>
                <div className="mt-1 text-sm text-slate-500">during beta</div>
              </div>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {betaFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-slate-600">
                  <Check
                    className="mt-0.5 h-4 w-4 text-teal-700"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8">
              <Link href="/practice">Start practicing</Link>
            </Button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-[#fbfbf8] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-700">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              Pro plans are not active during beta
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Paid plans will be added after the beta flow is stable. Payment
              options are intentionally disabled for now.
            </p>
            <ul className="mt-6 space-y-3">
              {plannedFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-slate-600">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
