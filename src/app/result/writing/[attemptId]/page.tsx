import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PenLine } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WritingTaskVisual } from "@/components/writing/writing-task-visual";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWritingAttemptResult } from "@/server/services/writing-practice";

type WritingResultPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function WritingResultPage({
  params,
}: WritingResultPageProps) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?checkout=login_required");
  }

  const result = await getWritingAttemptResult({
    attemptId,
    userId: user.id,
  });

  if (!result) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writing Result"
        title={result.title}
        description="AI feedback follows IELTS Writing criteria. The score is an estimate and does not represent an official IELTS score."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Overall Estimated Band" value={result.overallBand.toFixed(1)} />
        <Metric label="Task Response" value={result.taskResponse.toFixed(1)} />
        <Metric
          label="Coherence"
          value={result.coherenceCohesion.toFixed(1)}
        />
        <Metric label="Lexical" value={result.lexicalResource.toFixed(1)} />
        <Metric
          label="Grammar"
          value={result.grammaticalRangeAccuracy.toFixed(1)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/practice/writing">Practice More</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Writing task</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge>Task {result.taskType}</Badge>
                <Badge className="bg-white">{result.topic}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WritingTaskVisual
              prompt={result.prompt}
              taskType={result.taskType}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Your essay</CardTitle>
              <Badge className="bg-white">{result.wordCount} words</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
              {result.essay.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 24)}-${index}`} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FeedbackBox title="中文反馈" text={result.feedbackZh} />
        <FeedbackBox title="English feedback" text={result.feedbackEn} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FeedbackList title="Grammar Issues" items={result.grammarIssues} />
        <FeedbackList
          title="Vocabulary Upgrades"
          items={result.vocabularyUpgrades}
        />
        <FeedbackList
          title="Sentence Improvements"
          items={result.sentenceImprovements}
        />
        <FeedbackList title="Next Steps" items={result.nextSteps} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FeedbackBox title="Band 7 Sample" text={result.sampleAnswerBand7} />
        <FeedbackBox title="Band 8 Sample" text={result.sampleAnswerBand8} />
      </div>

      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {result.disclaimer}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {label}
        </CardTitle>
        <PenLine className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}

function FeedbackBox({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-2 text-sm leading-6 text-slate-700">
            {items.map((item) => (
              <li key={item} className="rounded-md bg-slate-50 p-3">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No items returned.</p>
        )}
      </CardContent>
    </Card>
  );
}
