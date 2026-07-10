import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PenLine } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LocalizedFeedbackList,
  LocalizedScoreSummary,
} from "@/components/writing/localized-writing-feedback";
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
        eyebrowKey="result.writingEyebrow"
        title={result.title}
        description="AI feedback follows IELTS Writing criteria. The score is an estimate and does not represent an official IELTS score."
        descriptionKey="result.writingDescription"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Overall Estimated Band"
          labelKey="result.overallBand"
          value={result.overallBand.toFixed(1)}
        />
      </div>

      <LocalizedScoreSummary
        fallbackItems={result.scoreSummary}
        zhItems={result.scoreSummaryZh}
        enItems={result.scoreSummaryEn}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={result.taskType === 1 ? "Task Achievement" : "Task Response"}
          labelKey={
            result.taskType === 1
              ? "result.taskAchievement"
              : "result.taskResponse"
          }
          value={result.taskResponse.toFixed(1)}
        />
        <Metric
          label="Coherence and Cohesion"
          labelKey="result.coherenceCohesion"
          value={result.coherenceCohesion.toFixed(1)}
        />
        <Metric
          label="Lexical Resource"
          labelKey="result.lexicalResource"
          value={result.lexicalResource.toFixed(1)}
        />
        <Metric
          label="Grammatical Range and Accuracy"
          labelKey="result.grammaticalRangeAccuracy"
          value={result.grammaticalRangeAccuracy.toFixed(1)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/practice/writing">
            <LocalizedText k="result.practiceMore" fallback="Practice More" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <LocalizedText
              k="result.backDashboard"
              fallback="Back to Dashboard"
            />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                <LocalizedText k="result.writingTask" fallback="Writing task" />
              </CardTitle>
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
              visualData={result.visualData}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                <LocalizedText k="result.yourEssay" fallback="Your essay" />
              </CardTitle>
              <Badge className="bg-white">
                {result.wordCount} <LocalizedText k="writing.words" fallback="words" />
              </Badge>
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
        <FeedbackBox
          title="Chinese feedback"
          titleKey="result.chineseFeedback"
          text={result.feedbackZh}
        />
        <FeedbackBox
          title="English feedback"
          titleKey="result.englishFeedback"
          text={result.feedbackEn}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LocalizedFeedbackList
          title="Grammar Issues"
          titleKey="result.grammarIssues"
          fallbackItems={result.grammarIssues}
          zhItems={result.grammarIssuesZh}
          enItems={result.grammarIssuesEn}
        />
        <LocalizedFeedbackList
          title="Vocabulary Upgrades"
          titleKey="result.vocabularyUpgrades"
          fallbackItems={result.vocabularyUpgrades}
          zhItems={result.vocabularyUpgradesZh}
          enItems={result.vocabularyUpgradesEn}
        />
        <LocalizedFeedbackList
          title="Sentence Improvements"
          titleKey="result.sentenceImprovements"
          fallbackItems={result.sentenceImprovements}
          zhItems={result.sentenceImprovementsZh}
          enItems={result.sentenceImprovementsEn}
        />
        <LocalizedFeedbackList
          title="Next Steps"
          titleKey="result.nextSteps"
          fallbackItems={result.nextSteps}
          zhItems={result.nextStepsZh}
          enItems={result.nextStepsEn}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FeedbackBox
          title="Band 7 Sample"
          titleKey="result.sampleAnswer"
          text={result.sampleAnswerBand7}
        />
        <FeedbackBox
          title="Band 8 Sample"
          titleKey="result.sampleAnswer"
          text={result.sampleAnswerBand8}
        />
      </div>

      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {result.disclaimer}
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  labelKey,
  value,
}: {
  label: string;
  labelKey?: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {labelKey ? <LocalizedText k={labelKey} fallback={label} /> : label}
        </CardTitle>
        <PenLine className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}

function FeedbackBox({
  title,
  titleKey,
  text,
}: {
  title: string;
  titleKey?: string;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {titleKey ? <LocalizedText k={titleKey} fallback={title} /> : title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {text}
        </p>
      </CardContent>
    </Card>
  );
}
