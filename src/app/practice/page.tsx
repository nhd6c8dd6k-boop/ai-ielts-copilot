import Link from "next/link";
import { BookOpen, Headphones, PenLine, Timer } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLoginRedirectHref } from "@/lib/auth/redirect";
import { isUserSignedIn } from "@/server/services/auth-session";
import { getPracticeLibraryStats } from "@/server/services/practice-library";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const [stats, isSignedIn] = await Promise.all([
    getPracticeLibraryStats(),
    isUserSignedIn(),
  ]);

  const cards = [
    {
      title: "Reading Practice",
      titleKey: "practice.reading.title",
      description:
        "Practise IELTS-style Reading sets with automatic scoring and explanations.",
      descriptionKey: "practice.reading.description",
      count: stats.readingCount,
      countLabelKey: "practice.setsAvailable",
      countLabel: "sets available",
      href: "/practice/reading",
      cta: "Start Reading Practice",
      ctaKey: "practice.reading.cta",
      icon: BookOpen,
      badge: null,
    },
    {
      title: "Listening Practice",
      titleKey: "practice.listening.title",
      description:
        "Practise with audio-based Listening sets, then review your answers and explanations.",
      descriptionKey: "practice.listening.description",
      count: stats.listeningCount,
      countLabelKey: "practice.setsAvailable",
      countLabel: "sets available",
      href: "/practice/listening",
      cta: "Start Listening Practice",
      ctaKey: "practice.listening.cta",
      icon: Headphones,
      badge: "Audio practice",
      badgeKey: "practice.audioPractice",
    },
    {
      title: "Writing Practice",
      titleKey: "practice.writing.title",
      description:
        "Write Task 1 or Task 2 responses and get AI feedback on band score, criteria, grammar, and vocabulary.",
      descriptionKey: "practice.writing.description",
      count: stats.writingCount,
      countLabelKey: "practice.tasksAvailable",
      countLabel: "tasks available",
      href: "/practice/writing",
      cta: "Practice Writing",
      ctaKey: "practice.writing.cta",
      icon: PenLine,
      badge: "AI Feedback available",
      badgeKey: "practice.aiFeedbackAvailable",
    },
    {
      title: "Full Exam",
      titleKey: "practice.fullExam.title",
      description:
        "A longer Computer IELTS-style exam workspace for combining sections. Beta preview is available while full scoring is being refined.",
      descriptionKey: "practice.fullExam.description",
      count: null,
      countLabelKey: "practice.setsAvailable",
      countLabel: "",
      href: "/exam",
      cta: "Open Full Exam",
      ctaKey: "practice.fullExam.cta",
      icon: Timer,
      badge: "Beta preview",
      badgeKey: "practice.betaPreview",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        eyebrowKey="practice.eyebrow"
        title="Choose a beta practice mode"
        titleKey="practice.title"
        description="Choose Reading, Listening, or Writing practice and build familiarity with the computer-based IELTS workflow."
        descriptionKey="practice.description"
      />

      <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
        <LocalizedText
          k="practice.betaHint"
          fallback="Free during beta. Sign in to start practice and save your progress."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="overflow-hidden transition-colors hover:border-slate-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      <LocalizedText k={card.titleKey} fallback={card.title} />
                    </CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.count === null ? null : (
                        <Badge>
                          {card.count}{" "}
                          <LocalizedText
                            k={card.countLabelKey}
                            fallback={card.countLabel}
                          />
                        </Badge>
                      )}
                      {card.badge ? (
                        <Badge className="bg-white">
                          <LocalizedText
                            k={card.badgeKey}
                            fallback={card.badge}
                          />
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="min-h-[96px] text-sm leading-6 text-slate-600">
                  <LocalizedText
                    k={card.descriptionKey}
                    fallback={card.description}
                  />
                </p>
                <Button asChild className="mt-5 w-full">
                  <Link
                    href={
                      isSignedIn ? card.href : buildLoginRedirectHref(card.href)
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
    </AppShell>
  );
}
