import Link from "next/link";
import { BookOpen, Headphones, PenLine, Timer } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPracticeLibraryStats } from "@/server/services/practice-library";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const stats = await getPracticeLibraryStats();

  const cards = [
    {
      title: "Reading Practice",
      description:
        "Practice published original passages in a split-screen Computer IELTS-style workspace with automatic scoring.",
      count: stats.readingCount,
      countLabel: "published sets",
      href: "/practice/reading",
      cta: "Start Reading Practice",
      icon: BookOpen,
      badge: null,
    },
    {
      title: "Listening Practice",
      description:
        "Work through published IELTS-style listening audio with answer inputs, timer, automatic scoring, and result review.",
      count: stats.listeningCount,
      countLabel: "published sets",
      href: "/practice/listening",
      cta: "Start Listening Practice",
      icon: Headphones,
      badge:
        stats.pendingListeningCount > 0
          ? "Transcript fallback available"
          : "Audio-ready when available",
    },
    {
      title: "Writing Practice",
      description:
        "Choose a published Task 1 or Task 2 prompt, write in the browser, and submit for AI band feedback.",
      count: stats.writingCount,
      countLabel: "published tasks",
      href: "/practice/writing",
      cta: "Practice Writing",
      icon: PenLine,
      badge: "AI Feedback available",
    },
    {
      title: "Full Exam",
      description:
        "A longer Computer IELTS-style exam workspace for combining sections. Beta preview is available while full scoring is being refined.",
      count: null,
      countLabel: "",
      href: "/exam",
      cta: "Open Full Exam",
      icon: Timer,
      badge: "Beta preview",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        title="Choose a beta practice mode"
        description="Reading, Listening, and Writing are ready for beta practice with published original content, automatic scoring, and AI Writing feedback."
      />

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
                    <CardTitle>{card.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.count === null ? null : (
                        <Badge>
                          {card.count} {card.countLabel}
                        </Badge>
                      )}
                      {card.badge ? (
                        <Badge className="bg-white">{card.badge}</Badge>
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
                  {card.description}
                </p>
                <Button asChild className="mt-5 w-full">
                  <Link href={card.href}>{card.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
