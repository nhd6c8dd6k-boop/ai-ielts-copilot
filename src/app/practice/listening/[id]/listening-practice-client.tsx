"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Headphones } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ExamStatusHeader } from "@/components/practice/exam-status-header";
import { UsageStatus } from "@/components/practice/usage-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getElapsedSeconds } from "@/lib/exam-timer";
import { joinAnswerParts } from "@/lib/listening-answer-parts";
import { cn } from "@/lib/utils";
import type { ListeningExamPracticeSet } from "@/server/services/listening-practice";
import type { PracticeSetUsageDecision } from "@/server/services/usage-limits";

type ListeningPracticeClientProps = {
  listeningSet: ListeningExamPracticeSet;
  usageDecision: PracticeSetUsageDecision;
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
      message?: string;
    };

export function ListeningPracticeClient({
  listeningSet,
  usageDecision,
}: ListeningPracticeClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState(
    listeningSet.questions[0]?.id ?? "",
  );
  const [startedAtMs] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasReadyAudio =
    Boolean(listeningSet.audioUrl) && listeningSet.audioStatus === "ready";

  const answeredCount = useMemo(
    () =>
      listeningSet.questions.filter((question) =>
        isQuestionAnswered(question.answerCount, answers[question.id] ?? ""),
      ).length,
    [answers, listeningSet.questions],
  );

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const updateAnswerPart = (
    questionId: string,
    answerCount: number,
    partIndex: number,
    value: string,
  ) => {
    setAnswers((current) => {
      const parts = getAnswerInputParts(current[questionId] ?? "", answerCount);
      parts[partIndex] = value;

      return {
        ...current,
        [questionId]: joinAnswerParts(parts),
      };
    });
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
          timeSpentSeconds: getElapsedSeconds(startedAtMs),
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
          "message" in payload && payload.message
            ? payload.message
            : "error" in payload && payload.error
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
      <ExamStatusHeader
        testLabel={t("practice.examHeader.listeningTest", "Listening Test")}
        title={listeningSet.title}
        metadata={[
          `Band ${listeningSet.band}`,
          `Section ${listeningSet.section}`,
          listeningSet.topic,
        ]}
        answeredCount={answeredCount}
        totalQuestions={listeningSet.questions.length}
        flaggedCount={flaggedIds.length}
        startedAtMs={startedAtMs}
        isSubmitting={isSubmitting}
        onSubmit={submitPractice}
      />

      <UsageStatus
        resource="listening"
        isSignedIn
        used={usageDecision.used}
        limit={usageDecision.limit}
        unlimited={usageDecision.unlimited}
        detail="practice"
        isRepeatSet={usageDecision.isRepeat}
      />

      {error ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 items-start gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="min-h-0">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-950">
                  {t("practice.listeningSource", "Listening source")}
                </div>
                <Badge className="bg-slate-50">
                  <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatAudioStatus(listeningSet.audioStatus)}
                </Badge>
              </div>
              {hasReadyAudio ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {t("practice.audioPlayer", "Audio Player")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t(
                          "practice.audioPlayerDescription",
                          "Listen to the recording, then answer the questions on the right.",
                        )}
                      </p>
                    </div>
                    <Badge className="bg-teal-50 text-teal-800">
                      {t("practice.ready", "Ready")}
                    </Badge>
                  </div>
                  <audio
                    className="w-full"
                    src={listeningSet.audioUrl ?? undefined}
                    controls
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  {t(
                    "practice.audioFallback",
                    "Audio is not ready yet. Please come back when the recording is available.",
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="flex flex-col p-0 xl:max-h-[100dvh] xl:overflow-hidden">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-wrap gap-2">
                {listeningSet.questions.map((question) => {
                  const isActive = activeQuestionId === question.id;
                  const isAnswered = isQuestionAnswered(
                    question.answerCount,
                    answers[question.id] ?? "",
                  );
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

            <div className="space-y-4 p-4 xl:min-h-0 xl:flex-1 xl:overflow-auto">
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
                      aria-label={t("practice.flagQuestion", "Flag question")}
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
                  ) : question.answerCount > 1 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs leading-5 text-slate-500">
                        {t(
                          "practice.multiBlankHint",
                          "For questions with more than one blank, fill each blank separately.",
                        )}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {getAnswerInputParts(
                          answers[question.id] ?? "",
                          question.answerCount,
                        ).map((value, index) => (
                          <input
                            key={`${question.id}-${index}`}
                            value={value}
                            onChange={(event) =>
                              updateAnswerPart(
                                question.id,
                                question.answerCount,
                                index,
                                event.target.value,
                              )
                            }
                            placeholder={`${t("practice.typeAnswer", "Answer")} ${index + 1}`}
                            className="h-10 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        updateAnswer(question.id, event.target.value)
                      }
                      placeholder={t("practice.typeAnswer", "Type your answer")}
                      className="mt-4 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {answeredCount}/{listeningSet.questions.length}{" "}
                  {t("practice.answered", "answered")}
                </span>
                <span>
                  {flaggedIds.length} {t("practice.flagged", "flagged")}
                </span>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={submitPractice}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("practice.submitting", "Submitting")
                  : t("practice.submitAnswers", "Submit answers")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
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

function getAnswerInputParts(value: string, answerCount: number) {
  const parts = value.split(/\s*;\s*/);

  return Array.from({ length: answerCount }, (_, index) => parts[index] ?? "");
}

function isQuestionAnswered(answerCount: number, value: string) {
  if (answerCount <= 1) {
    return Boolean(value.trim());
  }

  return getAnswerInputParts(value, answerCount).every((part) =>
    Boolean(part.trim()),
  );
}
