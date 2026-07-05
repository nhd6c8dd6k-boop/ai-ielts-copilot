import Link from "next/link";
import { Clock3, FileText, PenLine } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedWritingTaskSummaries } from "@/server/services/writing-practice";

export const dynamic = "force-dynamic";

export default async function WritingPracticePage() {
  const tasks = await getPublishedWritingTaskSummaries();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writing Practice"
        title="Choose a published IELTS Writing task."
        description="Write Task 1 or Task 2 essays in the browser, save drafts, and submit for AI band feedback."
      />

      {tasks.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.map((task) => (
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
                        AI Feedback available
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
                    label="Estimated time"
                    value={`${task.estimatedTimeMinutes} min`}
                  />
                  <InfoMetric
                    icon={FileText}
                    label="Task type"
                    value={`Task ${task.taskType}`}
                  />
                  <InfoMetric
                    icon={PenLine}
                    label="Published"
                    value={new Date(task.createdAt).toLocaleDateString()}
                  />
                </div>

                <Button asChild className="mt-5 w-full sm:w-auto">
                  <Link href={`/practice/writing/${task.id}`}>Start Writing</Link>
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
              <Badge className="mt-5 bg-slate-50">Published content only</Badge>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                No published Writing tasks yet. Please check back later.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Published Writing tasks will appear here after admin review.
                Writing tasks include prompt details, draft saving, and AI
                feedback.
              </p>
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
