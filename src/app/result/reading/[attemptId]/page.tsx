import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getReadingAttemptResult } from "@/server/services/reading-practice";

type ReadingResultPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function ReadingResultPage({
  params,
}: ReadingResultPageProps) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?checkout=login_required");
  }

  const result = await getReadingAttemptResult({
    attemptId,
    userId: user.id,
  });

  if (!result) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reading Result"
        eyebrowKey="result.readingEyebrow"
        title={result.title}
        description="这是本次 Reading practice 的自动判分结果。正确答案和解析均由服务器端读取，不会在提交前暴露给前端。"
        descriptionKey="result.readingDescription"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Overall Score"
          labelKey="result.overallScore"
          value={`${result.score}%`}
        />
        <Metric
          label="Correct"
          labelKey="result.correct"
          value={`${result.correctCount}/${result.totalQuestions}`}
        />
        <Metric
          label="Estimated Band"
          labelKey="result.estimatedBand"
          value={result.bandEstimate.toFixed(1)}
        />
        <Metric
          label="Time Spent"
          labelKey="result.timeSpent"
          value={formatDuration(result.timeSpentSeconds)}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/practice/reading">
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <LocalizedText k="result.questionReview" fallback="Question review" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.questions.map((question) => (
            <div
              key={question.id}
              className={cn(
                "rounded-md border p-4",
                question.isCorrect
                  ? "border-teal-200 bg-teal-50"
                  : "border-rose-200 bg-rose-50",
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Q{question.number}</Badge>
                    <Badge className="bg-white">
                      {formatQuestionType(question.type)}
                    </Badge>
                    <Badge
                      className={
                        question.isCorrect
                          ? "bg-teal-100 text-teal-800"
                          : "bg-rose-100 text-rose-800"
                      }
                    >
                      {question.isCorrect ? (
                        <LocalizedText k="result.correct" fallback="Correct" />
                      ) : (
                        <LocalizedText
                          k="result.incorrect"
                          fallback="Incorrect"
                        />
                      )}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-950">
                    {question.prompt}
                  </p>
                </div>
                {question.isCorrect ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-teal-700"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleAlert
                    className="h-5 w-5 shrink-0 text-rose-700"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AnswerBox
                  label="Your answer"
                  labelKey="result.yourAnswer"
                  value={question.userAnswer || "-"}
                />
                <AnswerBox
                  label="Correct answer"
                  labelKey="result.correctAnswer"
                  value={question.correctAnswer}
                />
              </div>

              <div className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-slate-700">
                {question.explanationZh ? (
                  <p>
                    <span className="font-medium text-slate-950">
                      <LocalizedText
                        k="result.chineseExplanation"
                        fallback="Chinese explanation:"
                      />
                    </span>
                    {question.explanationZh}
                  </p>
                ) : null}
                {question.explanationEn ? (
                  <p className="mt-2">
                    <span className="font-medium text-slate-950">
                      <LocalizedText
                        k="result.englishExplanation"
                        fallback="English explanation:"
                      />
                    </span>{" "}
                    {question.explanationEn}
                  </p>
                ) : null}
                {question.synonyms.length ? (
                  <p className="mt-2">
                    <span className="font-medium text-slate-950">Synonyms:</span>{" "}
                    {question.synonyms.join("; ")}
                  </p>
                ) : null}
              </div>

              {question.vocabulary.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {question.vocabulary.slice(0, 4).map((item, index) => (
                    <div
                      key={`${getVocabularyWord(item)}-${index}`}
                      className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                    >
                      <p className="font-medium text-slate-950">
                        {getVocabularyWord(item)}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {getVocabularyMeaning(item)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Metric({
  label,
  labelKey,
  value,
}: {
  label: string;
  labelKey: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          <LocalizedText k={labelKey} fallback={label} />
        </CardTitle>
        <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}

function AnswerBox({
  label,
  labelKey,
  value,
}: {
  label: string;
  labelKey: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">
        <LocalizedText k={labelKey} fallback={label} />
      </p>
      <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

function formatQuestionType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds}s`;
}

function getVocabularyWord(item: unknown) {
  if (isVocabularyItem(item)) {
    return item.word;
  }

  return "Vocabulary";
}

function getVocabularyMeaning(item: unknown) {
  if (isVocabularyItem(item)) {
    return item.meaning_zh ?? item.meaningZh ?? item.meaning_en ?? item.meaningEn;
  }

  return "";
}

function isVocabularyItem(
  item: unknown,
): item is {
  word: string;
  meaning_zh?: string;
  meaningZh?: string;
  meaning_en?: string;
  meaningEn?: string;
} {
  return (
    typeof item === "object" &&
    item !== null &&
    "word" in item &&
    typeof item.word === "string"
  );
}
