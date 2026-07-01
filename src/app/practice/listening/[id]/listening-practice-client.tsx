"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  Clock3,
  Flag,
  Headphones,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListeningPracticeSet } from "@/server/services/listening-practice";

type ListeningPracticeClientProps = {
  listeningSet: ListeningPracticeSet;
};

type SubmitResponse =
  | {
      attemptId: string;
      score: number;
      correctCount: number;
      totalQuestions: number;
      percentage: number;
      bandEstimate: number;
    }
  | {
      error?: string;
    };

export function ListeningPracticeClient({
  listeningSet,
}: ListeningPracticeClientProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState(
    listeningSet.questions[0]?.id ?? "",
  );
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasReadyAudio =
    Boolean(listeningSet.audioUrl) && listeningSet.audioStatus === "ready";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const answeredCount = useMemo(
    () =>
      listeningSet.questions.filter((question) =>
        Boolean(answers[question.id]?.trim()),
      ).length,
    [answers, listeningSet.questions],
  );

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const jumpToQuestion = (questionId: string) => {
    setActiveQuestionId(questionId);
    questionRefs.current[questionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const submitPractice = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/listening/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listeningSetId: listeningSet.id,
          answers,
          timeSpentSeconds: secondsElapsed,
        }),
      });
      const payload = (await response.json()) as SubmitResponse;

      if (response.status === 401) {
        window.location.href = "/login?checkout=login_required";
        return;
      }

      if (!response.ok || !("attemptId" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Submit failed.",
        );
      }

      router.push(`/result/listening/${payload.attemptId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Submit failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>Listening</Badge>
            <Badge className="bg-white">Band {listeningSet.band}</Badge>
            <Badge className="bg-white">Section {listeningSet.section}</Badge>
            <Badge className="bg-white">{listeningSet.topic}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {listeningSet.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-50">
            {answeredCount}/{listeningSet.questions.length} answered
          </Badge>
          <Badge className="bg-slate-50">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(secondsElapsed)}
          </Badge>
          <Button type="button" onClick={submitPractice} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            Submit
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-[calc(100vh-210px)] gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card className="min-h-0">
          <CardContent className="h-[calc(100vh-230px)] overflow-auto p-0">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-950">
                  Listening source
                </div>
                <Badge className="bg-slate-50">
                  <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatAudioStatus(listeningSet.audioStatus)}
                </Badge>
              </div>
              {hasReadyAudio ? (
                <audio
                  className="mt-4 w-full"
                  src={listeningSet.audioUrl ?? undefined}
                  controls
                />
              ) : (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  Audio is not ready yet. You can use the script preview for
                  testing.
                </div>
              )}
            </div>

            <article className="p-6 text-[15px] leading-8 text-slate-700">
              <h2 className="mb-4 text-sm font-semibold text-slate-950">
                Script Preview
              </h2>
              {listeningSet.script.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 24)}-${index}`} className="mb-5">
                  {paragraph}
                </p>
              ))}
            </article>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="flex h-[calc(100vh-230px)] flex-col p-0">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-wrap gap-2">
                {listeningSet.questions.map((question) => {
                  const isActive = activeQuestionId === question.id;
                  const isAnswered = Boolean(answers[question.id]?.trim());
                  const isFlagged = flaggedIds.includes(question.id);

                  return (
                    <Button
                      key={question.id}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className={cn(
                        "h-9 w-9 px-0",
                        isAnswered && !isActive
                          ? "border-teal-300 bg-teal-50 text-teal-800"
                          : null,
                        isFlagged && !isActive
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : null,
                      )}
                      onClick={() => jumpToQuestion(question.id)}
                    >
                      {question.number}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-auto p-4">
              {listeningSet.questions.map((question) => (
                <div
                  key={question.id}
                  ref={(node) => {
                    questionRefs.current[question.id] = node;
                  }}
                  className={cn(
                    "rounded-md border p-4",
                    activeQuestionId === question.id
                      ? "border-slate-400 bg-white"
                      : "border-slate-200 bg-slate-50",
                  )}
                  onFocus={() => setActiveQuestionId(question.id)}
                  onMouseEnter={() => setActiveQuestionId(question.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge className="bg-white">Q{question.number}</Badge>
                      <Badge className="ml-2 bg-white">
                        {formatQuestionType(question.type)}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        flaggedIds.includes(question.id)
                          ? "text-amber-700"
                          : "text-slate-500"
                      }
                      onClick={() => toggleFlag(question.id)}
                      aria-label="Flag question"
                    >
                      <Flag className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-950">
                    {question.prompt}
                  </p>

                  {question.options.length ? (
                    <div className="mt-4 grid gap-2">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                        >
                          <input
                            type="radio"
                            name={question.id}
                            className="mt-1"
                            checked={answers[question.id] === option}
                            onChange={() => updateAnswer(question.id, option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        updateAnswer(question.id, event.target.value)
                      }
                      placeholder="Type your answer"
                      className="mt-4 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                {flaggedIds.length} flagged
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={submitPractice}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting" : "Submit answers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatAudioStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatQuestionType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
