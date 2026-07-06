import Link from "next/link";
import { BookOpen, Clock3, FileText } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLoginRedirectHref } from "@/lib/auth/redirect";
import { isUserSignedIn } from "@/server/services/auth-session";
import { getPublishedReadingSummaries } from "@/server/services/reading-practice";

export const dynamic = "force-dynamic";

export default async function ReadingPracticePage() {
  const [readingSets, isSignedIn] = await Promise.all([
    getPublishedReadingSummaries(),
    isUserSignedIn(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reading Practice"
        title="IELTS Reading practice sets"
        description="Practise IELTS-style Reading questions with a computer-based test layout, timer, automatic scoring, and answer explanations."
      />

      <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
        Free during beta. Sign in to start practice and save your progress.
        <span className="ml-1">Beta 阶段免费使用。登录后即可开始练习并保存记录。</span>
      </div>

      {readingSets.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {readingSets.map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{set.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>Band {set.band}</Badge>
                      <Badge className="bg-white">{set.topic}</Badge>
                      <Badge className="bg-slate-50">
                        {set.questionCount} questions
                      </Badge>
                    </div>
                  </div>
                  <BookOpen className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <InfoMetric
                    icon={FileText}
                    label="Question count"
                    value={`${set.questionCount}`}
                  />
                  <InfoMetric
                    icon={Clock3}
                    label="Estimated time"
                    value={`${set.estimatedTimeMinutes} min`}
                  />
                  <InfoMetric
                    icon={BookOpen}
                    label="Added"
                    value={new Date(set.createdAt).toLocaleDateString()}
                  />
                </div>

                <Button asChild className="mt-5 w-full sm:w-auto">
                  <Link
                    href={
                      isSignedIn
                        ? `/practice/reading/${set.id}`
                        : buildLoginRedirectHref(`/practice/reading/${set.id}`)
                    }
                  >
                    Start Practice
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[420px] items-center justify-center">
            <div className="max-w-md text-center">
              <BookOpen
                className="mx-auto h-10 w-10 text-slate-400"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                No Reading practice sets yet.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                New Reading practice sets will appear here soon. You can come
                back later to practise with timer, question navigation, and
                answer explanations.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/practice">Back to Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function InfoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}
