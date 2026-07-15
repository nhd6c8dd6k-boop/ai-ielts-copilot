"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countWords } from "@/lib/word-count";
import {
  demoWritingEssay,
  demoWritingFeedback,
  demoWritingPrompt,
  demoWritingScores,
} from "@/lib/demo-writing-feedback";

export function WritingSampleFeedbackPage() {
  const { language, t } = useI18n();
  const feedback = demoWritingFeedback[language];
  const wordCount = countWords(demoWritingEssay);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
              <div className="min-w-0">
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  {t("demo.badge", "Sample report")}
                </Badge>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {t(
                    "demo.title",
                    "See a complete IELTS Writing AI feedback example",
                  )}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  {t(
                    "demo.subtitle",
                    "This sample report shows the scores, task-specific feedback, sentence rewrites, and next steps you may receive after submitting an essay.",
                  )}
                </p>
                <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  {t(
                    "demo.disclaimer",
                    "This sample is provided to demonstrate the product and does not represent an official IELTS result.",
                  )}
                </p>
                <DemoCta />
              </div>

              <Card className="min-w-0 border-teal-200 bg-white shadow-lg">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                      {t("demo.overallBand", "Overall Band")}
                    </CardTitle>
                    <Badge className="bg-teal-50 text-teal-800">
                      {t("demo.fixedDemo", "Fixed demo")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-semibold tracking-tight text-slate-950">
                    {demoWritingScores.overall}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Metric
                      label={t("demo.taskResponse", "Task Response")}
                      value={demoWritingScores.taskResponse}
                    />
                    <Metric
                      label={t(
                        "demo.coherenceCohesion",
                        "Coherence and Cohesion",
                      )}
                      value={demoWritingScores.coherenceCohesion}
                    />
                    <Metric
                      label={t("demo.lexicalResource", "Lexical Resource")}
                      value={demoWritingScores.lexicalResource}
                    />
                    <Metric
                      label={t(
                        "demo.grammar",
                        "Grammatical Range and Accuracy",
                      )}
                      value={demoWritingScores.grammar}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{t("demo.promptTitle", "Essay prompt")}</CardTitle>
                <Badge className="bg-white">Task 2</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-slate-700">
                {demoWritingPrompt}
              </p>
              <details className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-950">
                  {t("demo.viewEssay", "View sample essay")}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {wordCount} {t("writing.words", "words")}
                  </span>
                </summary>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                  {demoWritingEssay.split(/\n{2,}/).map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>

          <ScoreSummary items={feedback.scoreSummary} />
          <TaskSpecificFeedback items={feedback.taskSpecific} />

          <div className="mt-6">
            <FeedbackBox
              title={t("demo.detailedFeedback", "Detailed feedback")}
              text={feedback.detailedFeedback}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <StructuredList
              title={t("demo.grammarIssues", "Grammar issues")}
              items={feedback.grammarIssues.map((item) => ({
                firstLabel: t("demo.original", "Original"),
                first: item.original,
                secondLabel: t("demo.correction", "Correction"),
                second: item.correction,
                thirdLabel: t("demo.explanation", "Explanation"),
                third: item.explanation,
              }))}
            />
            <StructuredList
              title={t("demo.vocabularyUpgrades", "Vocabulary upgrades")}
              items={feedback.vocabularyUpgrades.map((item) => ({
                firstLabel: t("demo.originalExpression", "Original expression"),
                first: item.original,
                secondLabel: t("demo.betterOption", "Better option"),
                second: item.better,
                thirdLabel: t("demo.explanation", "Explanation"),
                third: item.explanation,
              }))}
            />
            <StructuredList
              title={t("demo.sentenceImprovements", "Sentence improvements")}
              items={feedback.sentenceImprovements.map((item) => ({
                firstLabel: t("demo.original", "Original"),
                first: item.original,
                secondLabel: t("demo.improved", "Improved"),
                second: item.improved,
                thirdLabel: t("demo.why", "Why"),
                third: item.why,
              }))}
            />
            <SimpleList
              title={t("demo.nextSteps", "Next steps")}
              items={feedback.nextSteps}
            />
          </div>

          <Card className="mt-6 border-slate-200 bg-slate-50">
            <CardContent className="pt-6">
              <p className="text-sm leading-6 text-slate-600">
                {feedback.sampleAnswerNote}
              </p>
            </CardContent>
          </Card>

          <section className="mt-10 rounded-lg border border-teal-200 bg-[#f8faf8] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {t("demo.bottomCtaTitle", "Ready to try it with your own essay?")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {t(
                "demo.freeLimitNote",
                "Free users receive 1 AI Writing feedback each day.",
              )}
            </p>
            <DemoCta />
          </section>
        </div>
      </main>
      <SupportFooter />
    </div>
  );
}

function DemoCta() {
  const { t } = useI18n();

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg">
        <Link href="/practice/writing">
          {t("demo.primaryCta", "Get feedback on my essay")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/pricing">{t("demo.secondaryCta", "View Pro plans")}</Link>
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs leading-5 text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ScoreSummary({ items }: { items: string[] }) {
  const { t } = useI18n();

  return (
    <Card className="mt-6 border-sky-100 bg-sky-50/60">
      <CardHeader>
        <CardTitle>{t("demo.scoreSummary", "Score summary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TaskSpecificFeedback({
  items,
}: {
  items: Array<{
    label: string;
    status: "strong" | "needs_work" | "missing";
    feedback: string;
  }>;
}) {
  const { t } = useI18n();

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {t("demo.taskSpecificFeedback", "Task-specific feedback")}
          </CardTitle>
          <Badge className="bg-white">Task 2</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={`${item.label}-${item.status}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-950">{item.label}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.feedback}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "strong" | "needs_work" | "missing";
}) {
  const { t } = useI18n();
  const labelKey =
    status === "strong"
      ? "result.statusStrong"
      : status === "needs_work"
        ? "result.statusNeedsWork"
        : "result.statusMissing";
  const fallback =
    status === "strong"
      ? "Strong"
      : status === "needs_work"
        ? "Needs work"
        : "Missing";
  const className =
    status === "strong"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "needs_work"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return <Badge className={className}>{t(labelKey, fallback)}</Badge>;
}

function FeedbackBox({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-slate-700">{text}</p>
      </CardContent>
    </Card>
  );
}

function StructuredList({
  title,
  items,
}: {
  title: string;
  items: Array<{
    firstLabel: string;
    first: string;
    secondLabel: string;
    second: string;
    thirdLabel: string;
    third: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <div
              key={`${item.first.slice(0, 32)}-${item.second.slice(0, 16)}`}
              className="rounded-md bg-slate-50 p-3"
            >
              <TextPair label={item.firstLabel} text={item.first} />
              <TextPair label={item.secondLabel} text={item.second} />
              <TextPair label={item.thirdLabel} text={item.third} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TextPair({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-slate-800">{text}</p>
    </div>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2 rounded-md bg-slate-50 p-3">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
