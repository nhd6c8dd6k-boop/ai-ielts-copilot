import { Brain, FileCheck2, Gauge, Monitor } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";

const features = [
  {
    title: "AI Reading Generator",
    description:
      "Generate original passages with IELTS style questions, answer keys, bilingual explanations, paraphrases, and vocabulary notes.",
    icon: FileCheck2,
  },
  {
    title: "Computer IELTS Simulator",
    description:
      "Practice with timer, split reading workspace, answer sheet, question flags, highlights, autosave, and results.",
    icon: Monitor,
  },
  {
    title: "Adaptive Learning",
    description:
      "Track accuracy, error type, time spent, weak skills, and learning trend to recommend the next drill.",
    icon: Brain,
  },
  {
    title: "Performance Dashboard",
    description:
      "Estimate band progress across reading, listening, and writing with history, streaks, radar charts, and membership state.",
    icon: Gauge,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            AI native IELTS preparation
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            The MVP focuses on original generation, assessment, simulation, and
            adaptive practice. It is structured to grow into an international
            SaaS product.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-lg border border-slate-200 bg-white p-6"
              >
                <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
