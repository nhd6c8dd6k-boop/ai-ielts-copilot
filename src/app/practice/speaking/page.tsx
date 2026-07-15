import Link from "next/link";
import type { Metadata } from "next";
import { Mic2 } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "IELTS Speaking Practice",
  description:
    "IELTS Speaking practice is planned for AI IELTS Copilot. Practise Reading, Listening, and Writing while Speaking preparation is being built.",
  alternates: {
    canonical: absoluteUrl("/practice/speaking"),
  },
};

export default function SpeakingPracticePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Speaking Practice"
        eyebrowKey="speaking.eyebrow"
        title="IELTS Speaking practice is coming later"
        titleKey="speaking.title"
        description="Speaking practice is planned for a future version. For now, you can use AI IELTS Copilot to practise Reading, Listening, and Writing."
        descriptionKey="speaking.description"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <Mic2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>
              <LocalizedText
                k="speaking.cardTitle"
                fallback="Speaking is planned"
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            <LocalizedText
              k="speaking.cardDescription"
              fallback="We are keeping this page public so you can find future Speaking practice updates. It does not affect your current Reading, Listening, or Writing practice access."
            />
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/practice/writing">
                <LocalizedText
                  k="speaking.primaryCta"
                  fallback="Try Writing feedback"
                />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/practice">
                <LocalizedText
                  k="speaking.secondaryCta"
                  fallback="Back to practice"
                />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
