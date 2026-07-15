import Link from "next/link";
import { CheckCircle2, Clock3, FileText, PenLine } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PracticeCategoryTabs } from "@/components/practice/practice-category-tabs";
import { UsageStatus } from "@/components/practice/usage-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLoginRedirectHref } from "@/lib/auth/redirect";
import { getCurrentUserId } from "@/server/services/auth-session";
import { getPublishedWritingTaskSummaries } from "@/server/services/writing-practice";
import { getUserPracticeUsage } from "@/server/services/usage-limits";

export const dynamic = "force-dynamic";

const writingCategoryTabs = [
  { value: "all", labelKey: "practice.filter.all", fallback: "All" },
  { value: "task-1", labelKey: "practice.filter.task1", fallback: "Task 1" },
  { value: "task-2", labelKey: "practice.filter.task2", fallback: "Task 2" },
  { value: "charts", labelKey: "practice.filter.charts", fallback: "Charts" },
  { value: "tables", labelKey: "practice.filter.tables", fallback: "Tables" },
  { value: "process", labelKey: "practice.filter.process", fallback: "Process" },
] as const;

type WritingCategory = (typeof writingCategoryTabs)[number]["value"];

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WritingPracticePage({ searchParams }: PageProps) {
  const activeCategory = normalizeWritingCategory(
    getCategoryParam(await searchParams),
  );
  const userId = await getCurrentUserId();
  const [tasks, usage] = await Promise.all([
    getPublishedWritingTaskSummaries(userId),
    userId ? getUserPracticeUsage(userId) : Promise.resolve(null),
  ]);
  const visibleTasks = tasks.filter((task) =>
    matchesWritingCategory(task, activeCategory),
  );
  const isSignedIn = Boolean(userId);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writing Practice"
        eyebrowKey="writing.eyebrow"
        title="IELTS Writing practice tasks"
        titleKey="writing.title"
        description="Practise IELTS Writing Task 1 and Task 2, then get AI band feedback, scoring criteria comments, and improvement suggestions."
        descriptionKey="writing.description"
      />

      <UsageStatus
        resource="writing"
        isSignedIn={isSignedIn}
        usedToday={usage?.writing.usedToday}
        limitToday={usage?.writing.limitToday}
        unlimited={usage?.writing.unlimited}
      />

      <PracticeCategoryTabs
        activeCategory={activeCategory}
        tabs={[...writingCategoryTabs]}
      />

      {visibleTasks.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>Task {task.taskType}</Badge>
                      {task.visualTypeLabel ? (
                        <Badge className="bg-slate-50">
                          {task.visualTypeLabel}
                        </Badge>
                      ) : null}
                      <Badge className="bg-white">{task.topic}</Badge>
                      {task.bandTarget ? (
                        <Badge className="bg-white">
                          Band {task.bandTarget}
                        </Badge>
                      ) : null}
                      <Badge className="bg-teal-50 text-teal-800">
                        <LocalizedText
                          k="practice.aiFeedbackAvailable"
                          fallback="AI Feedback available"
                        />
                      </Badge>
                    </div>
                  </div>
                  <PenLine className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">
                  {task.promptSummary}
                </p>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <InfoMetric
                    icon={Clock3}
                    labelKey="practice.estimatedTime"
                    label="Estimated time"
                    value={`${task.estimatedTimeMinutes} min`}
                  />
                  <InfoMetric
                    icon={FileText}
                    labelKey="practice.taskType"
                    label="Task type"
                    value={`Task ${task.taskType}`}
                  />
                  <InfoMetric
                    icon={PenLine}
                    labelKey="practice.added"
                    label="Added"
                    value={new Date(task.createdAt).toLocaleDateString()}
                  />
                </div>

                {isSignedIn && task.completion ? (
                  <CompletionSummary
                    band={task.completion.lastBandLabel}
                    lastPractisedAt={task.completion.lastPractisedAt}
                  />
                ) : null}

                <Button asChild className="mt-5 w-full sm:w-auto">
                  <Link
                    href={
                      isSignedIn
                        ? `/practice/writing/${task.id}`
                        : buildLoginRedirectHref(`/practice/writing/${task.id}`)
                    }
                  >
                    {task.completion ? (
                      <LocalizedText
                        k="practice.practiceAgain"
                        fallback="Practice again"
                      />
                    ) : (
                      <LocalizedText k="writing.start" fallback="Start Writing" />
                    )}
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <PenLine className="h-6 w-6" aria-hidden="true" />
              </div>
              <Badge className="mt-5 bg-slate-50">
                <LocalizedText
                  k="practice.writing.title"
                  fallback="Writing practice"
                />
              </Badge>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                {activeCategory === "all" ? (
                  <LocalizedText
                    k="writing.emptyTitle"
                    fallback="No Writing practice tasks yet. Please check back later."
                  />
                ) : (
                  <LocalizedText
                    k="practice.filter.empty"
                    fallback="No practice tasks in this category yet."
                  />
                )}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="writing.emptyDescription"
                  fallback="New Writing tasks will appear here soon. You can practise Task 1 and Task 2 responses, save drafts, and get AI feedback."
                />
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function CompletionSummary({
  band,
  lastPractisedAt,
}: {
  band: string;
  lastPractisedAt: string;
}) {
  return (
    <div className="mt-5 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-white text-teal-800">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          <LocalizedText k="practice.completed" fallback="Completed" />
        </Badge>
        <span>
          <LocalizedText k="practice.lastBand" fallback="Last band" />:{" "}
          <span className="font-semibold">{band}</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-teal-800">
        <LocalizedText k="practice.lastPractised" fallback="Last practised" />:{" "}
        {new Date(lastPractisedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function InfoMetric({
  icon: Icon,
  label,
  labelKey,
  value,
}: {
  icon: typeof FileText;
  label: string;
  labelKey: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <LocalizedText k={labelKey} fallback={label} />
      </div>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}

function getCategoryParam(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const category = searchParams?.category;

  return Array.isArray(category) ? category[0] : category;
}

function normalizeWritingCategory(category?: string): WritingCategory {
  return writingCategoryTabs.some((tab) => tab.value === category)
    ? (category as WritingCategory)
    : "all";
}

function matchesWritingCategory(
  task: {
    taskType: 1 | 2;
    visualType:
      | "bar_chart"
      | "line_chart"
      | "pie_chart"
      | "table"
      | "process_diagram"
      | null;
  },
  category: WritingCategory,
) {
  if (category === "all") {
    return true;
  }

  if (category === "task-1") {
    return task.taskType === 1;
  }

  if (category === "task-2") {
    return task.taskType === 2;
  }

  if (category === "charts") {
    return ["bar_chart", "line_chart", "pie_chart"].includes(
      task.visualType ?? "",
    );
  }

  if (category === "tables") {
    return task.visualType === "table";
  }

  return task.visualType === "process_diagram";
}
