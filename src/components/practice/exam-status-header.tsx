"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Bookmark, CheckCircle2, Clock3, Loader2 } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getElapsedSeconds } from "@/lib/exam-timer";

type ExamStatusHeaderProps = {
  testLabel: string;
  title: string;
  metadata: string[];
  answeredCount: number;
  totalQuestions: number;
  flaggedCount: number;
  startedAtMs: number;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function ExamStatusHeader({
  testLabel,
  title,
  metadata,
  answeredCount,
  totalQuestions,
  flaggedCount,
  startedAtMs,
  isSubmitting,
  onSubmit,
}: ExamStatusHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 mb-4 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{testLabel}</Badge>
            {metadata.map((item, index) => (
              <Badge key={`${item}-${index}`} className="bg-white">
                {item}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-950 lg:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <TimerStatus
            startedAtMs={startedAtMs}
            label={t("practice.examHeader.timer", "Timer")}
          />
          <StatusPill
            label={t("practice.examHeader.answered", "Answered")}
            value={`${answeredCount}/${totalQuestions}`}
            ariaLabel={`${t(
              "practice.examHeader.answered",
              "Answered",
            )} ${answeredCount} / ${totalQuestions}`}
          />
          <StatusPill
            icon={<Bookmark className="h-3.5 w-3.5" aria-hidden="true" />}
            label={t("practice.examHeader.flagged", "Flagged")}
            value={String(flaggedCount)}
            ariaLabel={`${t(
              "practice.examHeader.flagged",
              "Flagged",
            )} ${flaggedCount}`}
          />
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting
              ? t("practice.submitting", "Submitting")
              : t("practice.submit", "Submit")}
          </Button>
        </div>
      </div>
    </header>
  );
}

function TimerStatus({
  startedAtMs,
  label,
}: {
  startedAtMs: number;
  label: string;
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const syncElapsedSeconds = () => {
      setSecondsElapsed(getElapsedSeconds(startedAtMs));
    };

    syncElapsedSeconds();
    const intervalId = window.setInterval(() => {
      syncElapsedSeconds();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAtMs]);

  return (
    <StatusPill
      icon={<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
      label={label}
      value={formatTime(secondsElapsed)}
      ariaLabel={`${label} ${formatTime(secondsElapsed)}`}
    />
  );
}

function StatusPill({
  icon,
  label,
  value,
  ariaLabel,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
      aria-label={ariaLabel}
    >
      {icon}
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium tabular-nums text-slate-950">{value}</span>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
