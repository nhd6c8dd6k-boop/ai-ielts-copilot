import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/seo";
import { getSpeakingLibraryStats } from "@/server/services/speaking-practice";

export const metadata: Metadata = {
  title: "IELTS Speaking Practice | AI IELTS Copilot",
  description:
    "Practice IELTS-style Speaking questions with sample answers, useful phrases, vocabulary, and answer-building guidance.",
  alternates: {
    canonical: absoluteUrl("/practice/speaking"),
  },
};

export const dynamic = "force-dynamic";

const speakingParts = [
  {
    part: 1,
    href: "/practice/speaking/part-1",
    titleKey: "speaking.part1",
    title: "Part 1",
    descriptionKey: "speaking.part1Description",
    description:
      "Short questions about familiar topics such as home, work, study, hobbies, and daily life.",
  },
  {
    part: 2,
    href: "/practice/speaking/part-2",
    titleKey: "speaking.part2",
    title: "Part 2",
    descriptionKey: "speaking.part2Description",
    description:
      "Cue card practice with structured ideas and extended sample answers.",
  },
  {
    part: 3,
    href: "/practice/speaking/part-3",
    titleKey: "speaking.part3",
    title: "Part 3",
    descriptionKey: "speaking.part3Description",
    description:
      "More abstract discussion questions with developed opinions and examples.",
  },
] as const;

export default async function SpeakingPracticePage() {
  const stats = await getSpeakingLibraryStats();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Speaking Library"
        eyebrowKey="speaking.eyebrow"
        title="Speaking Preparation"
        titleKey="speaking.title"
        description="Practice IELTS-style speaking questions with sample answers, useful phrases, and vocabulary."
        descriptionKey="speaking.description"
      />

      <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        <LocalizedText
          k="speaking.libraryNotice"
          fallback="This is a preparation library, not an AI speaking examiner. It does not record audio or request microphone access."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {speakingParts.map((part) => (
          <Card key={part.part} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="bg-slate-50">
                    <LocalizedText
                      k="speaking.topics"
                      fallback="Topics"
                    />{" "}
                    {stats.partCounts[part.part]}
                  </Badge>
                  <CardTitle className="mt-4">
                    <LocalizedText k={part.titleKey} fallback={part.title} />
                  </CardTitle>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="min-h-[96px] text-sm leading-6 text-slate-600">
                <LocalizedText
                  k={part.descriptionKey}
                  fallback={part.description}
                />
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href={part.href}>
                  <LocalizedText
                    k="speaking.viewTopics"
                    fallback="View Topics"
                  />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
