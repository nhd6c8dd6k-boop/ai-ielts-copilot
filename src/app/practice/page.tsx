import Link from "next/link";
import { BookOpen, Headphones, PenLine } from "lucide-react";

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
        "Computer IELTS-style reading with passage, answer sheet, timer, auto scoring, and result review.",
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
        "Published listening sets with questions, timer, auto scoring, and script preview when audio is pending.",
      count: stats.listeningCount,
      countLabel: "published sets",
      href: "/practice/listening",
      cta: "Start Listening Practice",
      icon: Headphones,
      badge:
        stats.pendingListeningCount > 0
          ? "Script preview available"
          : "Audio-ready when available",
    },
    {
      title: "Writing Practice",
      description:
        "Choose a published Task 1 or Task 2 prompt, write in the browser, save drafts, and prepare for AI feedback.",
      count: stats.writingCount,
      countLabel: "published tasks",
      href: "/practice/writing",
      cta: "Practice Writing",
      icon: PenLine,
      badge: "AI Feedback Coming Soon",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        title="Choose your next IELTS practice"
        description="V1 uses admin-reviewed, published original practice content. Reading and Listening support automatic scoring; Writing is available as practice mode while AI feedback is being configured."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{card.count} {card.countLabel}</Badge>
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
                <p className="min-h-[72px] text-sm leading-6 text-slate-600">
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
