import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Headphones,
  MessageSquareText,
  PenLine,
  Timer,
} from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLoginRedirectHref } from "@/lib/auth/redirect";
import { absoluteUrl, siteDescription } from "@/lib/seo";
import { isUserSignedIn } from "@/server/services/auth-session";

export const metadata: Metadata = {
  title: "IELTS Practice",
  description: siteDescription,
  alternates: {
    canonical: absoluteUrl("/practice"),
  },
};

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const isSignedIn = await isUserSignedIn();

  const practiceCards = [
    {
      slug: "reading",
      title: "Reading",
      titleKey: "practice.reading.title",
      description:
        "Practise IELTS-style Reading questions and review your results after submitting.",
      descriptionKey: "practice.reading.description",
      href: "/practice/reading",
      cta: "Start Reading",
      ctaKey: "practice.reading.cta",
      icon: BookOpen,
      badge: "Automatic scoring",
      badgeKey: "practice.automaticScoring",
    },
    {
      slug: "listening",
      title: "Listening",
      titleKey: "practice.listening.title",
      description:
        "Listen to IELTS-style audio, answer the questions, and review your results.",
      descriptionKey: "practice.listening.description",
      href: "/practice/listening",
      cta: "Start Listening",
      ctaKey: "practice.listening.cta",
      icon: Headphones,
      badge: "Audio practice",
      badgeKey: "practice.audioPractice",
    },
    {
      slug: "writing",
      title: "Writing",
      titleKey: "practice.writing.title",
      description:
        "Complete IELTS Writing tasks and receive detailed feedback across all four criteria.",
      descriptionKey: "practice.writing.description",
      href: "/practice/writing",
      cta: "Start Writing",
      ctaKey: "practice.writing.cta",
      icon: PenLine,
      badge: "AI feedback available",
      badgeKey: "practice.aiFeedbackAvailable",
      badgeClassName: "border-teal-200 bg-teal-50 text-teal-800",
    },
    {
      slug: "speaking",
      title: "Speaking",
      titleKey: "practice.speaking.title",
      description:
        "Browse IELTS Speaking topics and prepare answers for Parts 1, 2, and 3.",
      descriptionKey: "practice.speaking.description",
      href: "/practice/speaking",
      cta: "View Speaking Library",
      ctaKey: "practice.speaking.cta",
      icon: MessageSquareText,
      badge: "Topic library",
      badgeKey: "practice.topicLibrary",
    },
  ];
  const fullExamCard = {
    title: "Full IELTS Mock Exam",
    titleKey: "practice.fullExam.title",
    description:
      "Complete Reading, Listening, and Writing in one timed exam experience.",
    descriptionKey: "practice.fullExam.description",
    href: "/exam",
    cta: "Learn more",
    ctaKey: "practice.fullExam.cta",
    icon: Timer,
    badge: "Coming soon",
    badgeKey: "practice.comingSoon",
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        eyebrowKey="practice.eyebrow"
        title="Choose a practice mode"
        titleKey="practice.title"
        description="Choose Reading, Listening, Writing, or Speaking practice and build familiarity with the computer-based IELTS workflow."
        descriptionKey="practice.description"
      />

      <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
        <LocalizedText
          k="practice.betaHint"
          fallback="Sign in to start practice for free and save your progress."
        />
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {practiceCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.slug}
                className="flex h-full flex-col overflow-hidden transition-colors hover:border-slate-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>
                        <LocalizedText
                          k={card.titleKey}
                          fallback={card.title}
                        />
                      </CardTitle>
                      <div className="mt-3">
                        <Badge className={card.badgeClassName ?? "bg-white"}>
                          <LocalizedText
                            k={card.badgeKey}
                            fallback={card.badge}
                          />
                        </Badge>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                    <LocalizedText
                      k={card.descriptionKey}
                      fallback={card.description}
                    />
                  </p>
                  <Button asChild className="mt-auto w-full">
                    <Link
                      href={
                        isSignedIn
                          ? card.href
                          : buildLoginRedirectHref(card.href)
                      }
                    >
                      <LocalizedText k={card.ctaKey} fallback={card.cta} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <FullExamCard
          card={fullExamCard}
          href={
            isSignedIn
              ? fullExamCard.href
              : buildLoginRedirectHref(fullExamCard.href)
          }
        />
      </div>
    </AppShell>
  );
}

function FullExamCard({
  card,
  href,
}: {
  card: {
    title: string;
    titleKey: string;
    description: string;
    descriptionKey: string;
    href: string;
    cta: string;
    ctaKey: string;
    icon: typeof Timer;
    badge: string;
    badgeKey: string;
  };
  href: string;
}) {
  const Icon = card.icon;

  return (
    <Card className="overflow-hidden border-dashed border-slate-300 bg-slate-50/70">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  <LocalizedText k={card.titleKey} fallback={card.title} />
                </h2>
                <Badge className="bg-white">
                  <LocalizedText k={card.badgeKey} fallback={card.badge} />
                </Badge>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                <LocalizedText
                  k={card.descriptionKey}
                  fallback={card.description}
                />
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full shrink-0 bg-white sm:w-auto"
          >
            <Link href={href}>
              <LocalizedText k={card.ctaKey} fallback={card.cta} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
