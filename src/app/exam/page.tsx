import Link from "next/link";
import { BookOpen, Headphones, Timer } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExamPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Exam Mode"
        title="Full Computer IELTS mock exam is coming soon."
        description="The current MVP focuses on real published Reading and Listening practice sets. Full exam mode will be enabled after the reviewed content library has enough complete test sections."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <Timer className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Use practice mode for now</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>Real published content</Badge>
                <Badge className="bg-white">Auto scoring</Badge>
                <Badge className="bg-white">Dashboard tracking</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Reading and Listening practice already use Supabase-published
            content, submit answers through server-side scoring, and save real
            attempts to your dashboard. That is the recommended path for MVP
            testing.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/practice/reading">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Start Reading Practice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/practice/listening">
                <Headphones className="h-4 w-4" aria-hidden="true" />
                Start Listening Practice
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
