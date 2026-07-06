import Link from "next/link";
import { BookOpen, Headphones, PenLine, Timer } from "lucide-react";

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
      description:
        "Practise IELTS-style Reading sets with automatic scoring and explanations.",
      count: stats.readingCount,
      countLabel: "sets available",
      href: "/practice/reading",
      cta: "Start Reading Practice",
      icon: BookOpen,
      badge: null,
    },
    {
      title: "Listening Practice",
      description:
        "Practise with audio-based Listening sets, then review your answers and explanations.",
      count: stats.listeningCount,
      countLabel: "sets available",
      href: "/practice/listening",
      cta: "Start Listening Practice",
      icon: Headphones,
      badge: "Audio practice",
    },
    {
      title: "Writing Practice",
      description:
        "Write Task 1 or Task 2 responses and get AI feedback on band score, criteria, grammar, and vocabulary.",
      count: stats.writingCount,
      countLabel: "tasks available",
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
        description="Choose Reading, Listening, or Writing practice and build familiarity with the computer-based IELTS workflow."
      />

      <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
        Free during beta. Sign in to start practice and save your progress.
        <span className="ml-1">Beta 阶段免费使用。登录后即可开始练习并保存记录。</span>
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
                  <Link
                    href={
                      isSignedIn ? card.href : buildLoginRedirectHref(card.href)
                    }
                  >
                    {card.cta}
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
