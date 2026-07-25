import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Headphones, Timer } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Full IELTS Mock Exam",
  description:
    "Full IELTS Mock Exam is coming soon. Use published IELTS-style Reading, Listening, and Writing practice while the full timed experience is being prepared.",
  alternates: {
    canonical: absoluteUrl("/exam"),
  },
};

export default function ExamPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Full IELTS Mock Exam"
        eyebrowKey="exam.eyebrow"
        title="Full IELTS Mock Exam is coming soon."
        titleKey="exam.title"
        description="The current product focuses on published Reading, Listening, and Writing practice. The full timed exam experience will be enabled after the reviewed content library has enough complete test sections."
        descriptionKey="exam.description"
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <Timer className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>
                <LocalizedText
                  k="exam.cardTitle"
                  fallback="Use practice mode for now"
                />
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>
                  <LocalizedText
                    k="exam.badge.published"
                    fallback="Published content"
                  />
                </Badge>
                <Badge className="bg-white">
                  <LocalizedText
                    k="exam.badge.scoring"
                    fallback="Auto scoring"
                  />
                </Badge>
                <Badge className="bg-white">
                  <LocalizedText
                    k="exam.badge.dashboard"
                    fallback="Dashboard tracking"
                  />
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            <LocalizedText
              k="exam.body"
              fallback="Reading and Listening practice already use published content, submit answers through server-side scoring, and save attempts to your dashboard. Writing offers AI feedback while the full timed exam experience is being prepared."
            />
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/practice/reading">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <LocalizedText k="exam.readingCta" fallback="Start Reading" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/practice/listening">
                <Headphones className="h-4 w-4" aria-hidden="true" />
                <LocalizedText
                  k="exam.listeningCta"
                  fallback="Start Listening"
                />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
