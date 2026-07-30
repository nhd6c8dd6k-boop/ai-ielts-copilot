"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Headphones,
  LineChart,
  ShieldCheck,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MethodologyPageClient() {
  const { t } = useI18n();

  const writingCriteria = [
    "Task Achievement / Task Response",
    "Coherence and Cohesion",
    "Lexical Resource",
    "Grammatical Range and Accuracy",
  ];

  const calibrationChecks = [
    t("methodology.calibration.item.taskType", "Task 1 and Task 2 distinction"),
    t("methodology.calibration.item.length", "Minimum word guidance and underlength handling"),
    t("methodology.calibration.item.taskFeedback", "Task-specific feedback"),
    t("methodology.calibration.item.consistency", "Score consistency checks"),
    t("methodology.calibration.item.improvements", "Sentence improvements, strengths and areas to improve"),
  ];

  const reviewChecks = [
    t("methodology.review.item.clarity", "Clarity"),
    t("methodology.review.item.originality", "Originality"),
    t("methodology.review.item.format", "Task format"),
    t("methodology.review.item.data", "Data consistency"),
    t("methodology.review.item.answers", "Answer alignment"),
    t("methodology.review.item.visual", "Visual validity"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="max-w-3xl">
              <Badge className="border-slate-950 bg-slate-950 text-white">
                {t("methodology.hero.badge", "Methodology")}
              </Badge>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {t(
                  "methodology.hero.title",
                  "How AI IELTS Copilot builds useful IELTS practice feedback",
                )}
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                {t(
                  "methodology.hero.description",
                  "We combine criteria-based Writing feedback, internal content review and transparent limitations so students know what the product can and cannot do.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {t("methodology.writing.title", "Writing Feedback Method")}
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              <p>
                {t(
                  "methodology.writing.description",
                  "Writing responses are analysed across the four public IELTS Writing assessment criteria:",
                )}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {writingCriteria.map((criterion) => (
                  <li
                    key={criterion}
                    className="flex gap-3 rounded-md border border-slate-200 bg-[#f8faf8] p-3"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
              <p>
                {t(
                  "methodology.writing.followup",
                  "The system also checks task completion, response length and score consistency before presenting an estimated band score and detailed feedback.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-teal-800 ring-1 ring-teal-200">
                <LineChart className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {t(
                  "methodology.calibration.title",
                  "Score Calibration and Safety Checks",
                )}
              </h2>
            </div>
            <div>
              <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {t(
                  "methodology.calibration.description",
                  "Task-specific checks help reduce inconsistent feedback. The report is designed to show practical strengths, areas to improve and sentence-level examples without claiming to replace an official result.",
                )}
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {calibrationChecks.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {t("methodology.review.title", "Practice Content Review")}
              </h2>
            </div>
            <div>
              <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {t(
                  "methodology.review.description",
                  "AI-generated practice content enters an internal review stage before publication.",
                )}
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {reviewChecks.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-slate-200 bg-[#f8faf8] p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-teal-800 ring-1 ring-teal-200">
                <Headphones className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {t("methodology.listening.title", "Listening Audio Production")}
              </h2>
            </div>
            <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              {t(
                "methodology.listening.description",
                "Listening audio is produced from reviewed IELTS-style scripts using ElevenLabs voice technology. Scripts, questions and answer keys are checked before publication.",
              )}
            </p>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-slate-200 bg-[#f8faf8] p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {t("methodology.limitations.title", "Limitations and Disclaimer")}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {t(
                  "methodology.limitations.description",
                  "AI feedback is designed for study support. Estimated band scores are not official IELTS results and may differ from a certified examiner’s assessment.",
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {t("methodology.cta.title", "Ready to try Writing feedback?")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {t(
                  "methodology.cta.description",
                  "Start with one Writing task or view a sample report first.",
                )}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/practice/writing">
                    {t("methodology.cta.primary", "Try Writing feedback")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/demo/writing-feedback">
                    {t("methodology.cta.secondary", "View sample feedback")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SupportFooter />
    </div>
  );
}
