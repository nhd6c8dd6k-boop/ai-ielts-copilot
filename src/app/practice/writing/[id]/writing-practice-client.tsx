"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, PenLine, Save } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WritingTaskVisual } from "@/components/writing/writing-task-visual";
import type { PublishedWritingTask } from "@/server/services/writing-practice";

type WritingPracticeClientProps = {
  task: PublishedWritingTask;
  isAiFeedbackAvailable: boolean;
};

type SubmitResponse =
  | {
      attemptId: string;
      overallBand: number;
    }
  | {
      error?: string;
    };

export function WritingPracticeClient({
  task,
  isAiFeedbackAvailable,
}: WritingPracticeClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const draftStorageKey = `ai-ielts-writing-draft-${task.id}`;
  const [essay, setEssay] = useState("");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey);

    if (savedDraft) {
      const frameId = window.requestAnimationFrame(() => {
        setEssay(savedDraft);
        setNotice("draftRestored");
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    return undefined;
  }, [draftStorageKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const wordCount = useMemo(() => countWords(essay), [essay]);
  const isBelowMinimum = wordCount > 0 && wordCount < task.minimumWords;

  const submitEssay = async () => {
    if (!isAiFeedbackAvailable) {
      setError(null);
      setNotice(
        "feedbackUnavailable",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/practice/writing/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          writingTaskId: task.id,
          essay,
          timeSpentSeconds: secondsElapsed,
        }),
      });
      const payload = (await response.json()) as SubmitResponse;

      if (response.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname,
        )}`;
        return;
      }

      if (!response.ok || !("attemptId" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Writing feedback failed.",
        );
      }

      router.push(`/result/writing/${payload.attemptId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Writing feedback failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = () => {
    window.localStorage.setItem(draftStorageKey, essay);
    setError(null);
    setNotice("draftSaved");
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>Writing</Badge>
            <Badge className="bg-white">Task {task.taskType}</Badge>
            <Badge className="bg-white">{task.topic}</Badge>
            {task.bandTarget ? (
              <Badge className="bg-white">Target Band {task.bandTarget}</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {task.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-50">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(secondsElapsed)}
          </Badge>
          <Badge className={isBelowMinimum ? "bg-amber-50 text-amber-800" : "bg-slate-50"}>
            {wordCount} {t("writing.words", "words")}
          </Badge>
          <Button
            type="button"
            onClick={submitEssay}
            disabled={isSubmitting || !isAiFeedbackAvailable}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            {t("writing.submitFeedback", "Submit for AI Feedback")}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!isAiFeedbackAvailable ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {t(
            "writing.feedbackUnavailable",
            "AI Writing feedback is temporarily unavailable. You can still practice writing and save your draft.",
          )}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {notice === "draftRestored"
            ? t("writing.draftRestored", "Draft restored from this browser.")
            : notice === "draftSaved"
              ? t("writing.draftSaved", "Draft saved in this browser.")
              : notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("writing.prompt", "Writing prompt")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>
                {t("writing.suggestedTime", "Suggested time")}:{" "}
                {task.estimatedTimeMinutes} minutes
              </Badge>
              <Badge className="bg-white">
                {t("writing.atLeast", "At least")} {task.minimumWords}{" "}
                {t("writing.words", "words")}
              </Badge>
            </div>
            <WritingTaskVisual
              prompt={task.prompt}
              taskType={task.taskType}
              visualData={task.visualData}
            />
            <p className="text-xs leading-5 text-slate-500">
              {t(
                "writing.disclaimer",
                "AI Score is an estimate and does not represent an official IELTS score.",
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t("writing.essayEditor", "Essay editor")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white">
                  {wordCount} {t("writing.words", "words")}
                </Badge>
                <Badge
                  className={
                    wordCount >= task.minimumWords
                      ? "bg-teal-50 text-teal-800"
                      : "bg-amber-50 text-amber-800"
                  }
                >
                  {t("writing.minimum", "Minimum")} {task.minimumWords}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              className="min-h-[520px] w-full resize-y rounded-md border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              placeholder={t(
                "writing.placeholder",
                "Write your IELTS essay in English...",
              )}
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={submitEssay}
                disabled={isSubmitting || !isAiFeedbackAvailable}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting
                  ? t("writing.gettingFeedback", "Getting feedback")
                  : t("writing.submitFeedback", "Submit for AI Feedback")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={!essay.trim()}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {t("writing.saveDraft", "Save Draft")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEssay("")}
                disabled={isSubmitting}
              >
                {t("writing.clearEssay", "Clear essay")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
