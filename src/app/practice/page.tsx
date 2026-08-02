import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Headphones,
  type LucideIcon,
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
      slug: "writing",
      title: "Writing",
      titleKey: "practice.writing.title",
      description:
        "Get an estimated band, criteria-based feedback, and sentence improvements.",
      descriptionKey: "practice.writing.description",
      href: "/practice/writing",
      cta: "Start Writing practice",
      ctaKey: "practice.writing.cta",
      icon: PenLine,
      badge: "AI Feedback",
      badgeKey: "practice.aiFeedbackAvailable",
      isFeatured: true,
    },
    {
      slug: "reading",
      title: "Reading",
      titleKey: "practice.reading.title",
      description:
        "Practice IELTS-style passages with automatic answer checking.",
      descriptionKey: "practice.reading.description",
      href: "/practice/reading",
      cta: "Start Reading practice",
      ctaKey: "practice.reading.cta",
      icon: BookOpen,
      badge: "Auto scoring",
      badgeKey: "practice.automaticScoring",
    },
    {
      slug: "listening",
      title: "Listening",
      titleKey: "practice.listening.title",
      description:
        "Practice with IELTS-style audio created from reviewed scripts.",
      descriptionKey: "practice.listening.description",
      href: "/practice/listening",
      cta: "Start Listening practice",
      ctaKey: "practice.listening.cta",
      icon: Headphones,
      badge: "Audio practice",
      badgeKey: "practice.audioPractice",
    },
    {
      slug: "speaking",
      title: "Speaking",
      titleKey: "practice.speaking.title",
      description:
        "Prepare for Part 1, Part 2, and Part 3 with questions, ideas, and sample answers.",
      descriptionKey: "practice.speaking.description",
      href: "/practice/speaking",
      cta: "Open Speaking preparation",
      ctaKey: "practice.speaking.cta",
      icon: MessageSquareText,
      badge: "Preparation",
      badgeKey: "practice.topicLibrary",
    },
  ];
  const fullExamCard = {
    title: "Full Mock Test",
    titleKey: "practice.fullExam.title",
    description:
      "Complete Listening, Reading, and Writing in one timed computer-based practice session.",
    descriptionKey: "practice.fullExam.description",
    icon: Timer,
    badge: "Coming soon",
    badgeKey: "practice.comingSoon",
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        eyebrowKey="practice.eyebrow"
        title="Practice every IELTS skill"
        titleKey="practice.title"
        description="Choose a skill and start an IELTS-style practice activity."
        descriptionKey="practice.description"
      />

      <p className="mb-5 text-sm font-medium text-slate-500">
        <LocalizedText
          k="practice.betaHint"
          fallback="Four skills. One practice hub."
        />
      </p>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {practiceCards.map((card) => (
            <PracticeModuleCard
              key={card.slug}
              card={card}
              href={
                isSignedIn ? card.href : buildLoginRedirectHref(card.href)
              }
            />
          ))}
        </div>

        <FullExamCard card={fullExamCard} />
      </div>
    </AppShell>
  );
}

type PracticeModuleCardData = {
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  href: string;
  cta: string;
  ctaKey: string;
  icon: LucideIcon;
  badge: string;
  badgeKey: string;
  isFeatured?: boolean;
};

function PracticeModuleCard({
  card,
  href,
}: {
  card: PracticeModuleCardData;
  href: string;
}) {
  const Icon = card.icon;

  return (
    <Card
      className={
        card.isFeatured
          ? "flex h-full flex-col overflow-hidden border-teal-200 bg-teal-50/60 transition-colors hover:border-teal-300"
          : "flex h-full flex-col overflow-hidden transition-colors hover:border-slate-300"
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>
              <LocalizedText k={card.titleKey} fallback={card.title} />
            </CardTitle>
            <div className="mt-3">
              <Badge
                className={
                  card.isFeatured
                    ? "border-teal-200 bg-white text-teal-800"
                    : "bg-white text-slate-700"
                }
              >
                <LocalizedText k={card.badgeKey} fallback={card.badge} />
              </Badge>
            </div>
          </div>
          <div
            className={
              card.isFeatured
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm leading-6 text-slate-600">
          <LocalizedText
            k={card.descriptionKey}
            fallback={card.description}
          />
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href={href}>
            <LocalizedText k={card.ctaKey} fallback={card.cta} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FullExamCard({
  card,
}: {
  card: {
    title: string;
    titleKey: string;
    description: string;
    descriptionKey: string;
    icon: typeof Timer;
    badge: string;
    badgeKey: string;
  };
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
          <div className="w-full shrink-0 rounded-md border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-500 sm:w-auto">
            <LocalizedText k={card.badgeKey} fallback={card.badge} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
