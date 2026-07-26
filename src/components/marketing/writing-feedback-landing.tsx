"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  PenLine,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  demoWritingFeedback,
  demoWritingScores,
} from "@/lib/demo-writing-feedback";

const featureCards = [
  {
    icon: Target,
    titleKey: "writingFeedback.features.band.title",
    titleFallback: "Estimated Band",
    bodyKey: "writingFeedback.features.band.body",
    bodyFallback: "Receive an estimated overall band score.",
  },
  {
    icon: ListChecks,
    titleKey: "writingFeedback.features.criteria.title",
    titleFallback: "Four Criteria",
    bodyKey: "writingFeedback.features.criteria.body",
    bodyFallback:
      "Feedback across Task Achievement / Response, Coherence & Cohesion, Lexical Resource, and Grammar.",
  },
  {
    icon: Wand2,
    titleKey: "writingFeedback.features.sentences.title",
    titleFallback: "Sentence Improvements",
    bodyKey: "writingFeedback.features.sentences.body",
    bodyFallback: "Review clearer sentence suggestions and corrections.",
  },
  {
    icon: ClipboardCheck,
    titleKey: "writingFeedback.features.actionable.title",
    titleFallback: "Actionable Feedback",
    bodyKey: "writingFeedback.features.actionable.body",
    bodyFallback: "Understand what to improve before your next attempt.",
  },
];

const howItWorks = [
  {
    titleKey: "writingFeedback.how.step1.title",
    titleFallback: "Choose a Writing task",
    bodyKey: "writingFeedback.how.step1.body",
    bodyFallback: "Start with an IELTS-style Task 1 or Task 2 prompt.",
  },
  {
    titleKey: "writingFeedback.how.step2.title",
    titleFallback: "Write your response",
    bodyKey: "writingFeedback.how.step2.body",
    bodyFallback: "Complete your answer online in the Writing practice area.",
  },
  {
    titleKey: "writingFeedback.how.step3.title",
    titleFallback: "Receive detailed AI feedback",
    bodyKey: "writingFeedback.how.step3.body",
    bodyFallback: "See your estimated band, criteria notes, rewrites, and next focus.",
  },
];

const trustItems = [
  { key: "writingFeedback.trust.free", fallback: "Free to try" },
  { key: "writingFeedback.trust.noCard", fallback: "No credit card required" },
  {
    key: "writingFeedback.trust.criteria",
    fallback: "Feedback based on IELTS Writing assessment criteria",
  },
];

export function WritingFeedbackLanding() {
  const { language, t } = useI18n();
  const feedback = demoWritingFeedback[language];
  const sentenceImprovement = feedback.sentenceImprovements[0];
  const scoreSummary = feedback.scoreSummary.slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-[#f7faf9]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)] lg:items-center lg:px-8 lg:py-14">
            <div className="min-w-0">
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {t("writingFeedback.hero.eyebrow", "AI IELTS Writing")}
              </Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {t(
                  "writingFeedback.hero.title",
                  "Get free IELTS Writing feedback in minutes",
                )}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                {t(
                  "writingFeedback.hero.description",
                  "Receive an estimated band score and detailed feedback across the IELTS Writing assessment criteria.",
                )}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/practice/writing">
                    {t(
                      "writingFeedback.cta.primary",
                      "Try free Writing feedback",
                    )}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/demo/writing-feedback">
                    {t("writingFeedback.cta.secondary", "View sample feedback")}
                  </Link>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                {trustItems.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    {t(item.key, item.fallback)}
                  </span>
                ))}
              </div>
            </div>

            <WritingFeedbackPreview
              scoreSummary={scoreSummary}
              sentenceImprovement={sentenceImprovement}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.titleKey} className="h-full">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold text-slate-950">
                      {t(feature.titleKey, feature.titleFallback)}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {t(feature.bodyKey, feature.bodyFallback)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:items-start lg:px-8">
            <div>
              <Badge>{t("writingFeedback.how.eyebrow", "How it works")}</Badge>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-slate-950">
                {t(
                  "writingFeedback.how.title",
                  "From essay to feedback in three steps",
                )}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                {t(
                  "writingFeedback.how.description",
                  "The goal is simple: write once, understand what held the score back, then practise the next essay with a clearer focus.",
                )}
              </p>
            </div>
            <div className="grid gap-3">
              {howItWorks.map((step, index) => (
                <Card key={step.titleKey}>
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {t(step.titleKey, step.titleFallback)}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {t(step.bodyKey, step.bodyFallback)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <Badge className="bg-teal-50 text-teal-800">
            {t("writingFeedback.final.eyebrow", "Free Writing practice")}
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t(
              "writingFeedback.final.title",
              "Ready to improve your IELTS Writing?",
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {t(
              "writingFeedback.final.description",
              "Try one Writing task now, or review the sample report first to see the type of feedback you can expect.",
            )}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/practice/writing">
                {t("writingFeedback.cta.primary", "Try free Writing feedback")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/demo/writing-feedback">
                {t("writingFeedback.cta.secondary", "View sample feedback")}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {t(
              "writingFeedback.disclaimer",
              "AI feedback is for study support and is not an official IELTS score.",
            )}
          </p>
        </section>
      </main>
      <SupportFooter />
    </div>
  );
}

function WritingFeedbackPreview({
  scoreSummary,
  sentenceImprovement,
}: {
  scoreSummary: string[];
  sentenceImprovement: {
    original: string;
    improved: string;
    why: string;
  };
}) {
  const { t } = useI18n();

  return (
    <Card className="min-w-0 border-teal-200 shadow-lg">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            {t("writingFeedback.preview.title", "Writing feedback preview")}
          </CardTitle>
          <Badge className="bg-white">Task 2</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              {t("writingFeedback.preview.overall", "Estimated Band")}
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              {demoWritingScores.overall}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PreviewMetric
              label={t("demo.taskResponse", "Task Response")}
              value={demoWritingScores.taskResponse}
            />
            <PreviewMetric
              label={t("demo.coherenceCohesion", "Coherence and Cohesion")}
              value={demoWritingScores.coherenceCohesion}
            />
            <PreviewMetric
              label={t("demo.lexicalResource", "Lexical Resource")}
              value={demoWritingScores.lexicalResource}
            />
            <PreviewMetric
              label={t("demo.grammar", "Grammar")}
              value={demoWritingScores.grammar}
            />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Sparkles className="h-4 w-4 text-teal-700" aria-hidden="true" />
            {t("demo.scoreSummary", "Score summary")}
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {scoreSummary.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6">
          <div className="flex items-center gap-2 font-semibold text-slate-950">
            <PenLine className="h-4 w-4 text-teal-700" aria-hidden="true" />
            {t("demo.sentenceImprovements", "Sentence improvements")}
          </div>
          <TextPair
            label={t("demo.original", "Original")}
            text={sentenceImprovement.original}
          />
          <TextPair
            label={t("demo.improved", "Improved")}
            text={sentenceImprovement.improved}
          />
          <TextPair label={t("demo.why", "Why")} text={sentenceImprovement.why} />
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="truncate text-xs leading-5 text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TextPair({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-800">{text}</p>
    </div>
  );
}
