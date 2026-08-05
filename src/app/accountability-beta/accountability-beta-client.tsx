"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Target,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AccountabilityEnrollment,
  AccountabilityReminderPreference,
  AccountabilitySkill,
  AccountabilityTask,
} from "@/server/services/accountability-beta";

type TFunction = (key: string, fallback?: string) => string;

type AccountabilityResponse = {
  enabled: boolean;
  enrollment: AccountabilityEnrollment | null;
};

type JoinFormState = {
  targetBand: "6.0" | "6.5" | "7.0" | "7.5" | "8.0+";
  examDate: string;
  examDateUnknown: boolean;
  weakestSkill: AccountabilitySkill;
  dailyMinutes: 15 | 30 | 45 | 60;
  reminderPreference: AccountabilityReminderPreference;
};

type FeedbackState = {
  rating: number;
  helpedMost: string;
  difficulty: string;
  willingness: "yes" | "maybe" | "no";
};

const initialJoinForm: JoinFormState = {
  targetBand: "7.0",
  examDate: "",
  examDateUnknown: true,
  weakestSkill: "writing",
  dailyMinutes: 30,
  reminderPreference: "crisp",
};

const initialFeedback: FeedbackState = {
  rating: 5,
  helpedMost: "",
  difficulty: "",
  willingness: "maybe",
};

export function AccountabilityBetaClient() {
  const { t } = useI18n();
  const [state, setState] = useState<AccountabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState<JoinFormState>(initialJoinForm);
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);

  useEffect(() => {
    let isActive = true;

    async function loadState() {
      try {
        const response = await fetch("/api/accountability-beta", {
          cache: "no-store",
        });

        if (response.status === 401) {
          if (isActive) {
            setIsAuthenticated(false);
            setState({ enabled: true, enrollment: null });
          }
          return;
        }

        const payload = (await response.json()) as AccountabilityResponse | {
          error?: string;
        };

        if (!response.ok || !("enabled" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Failed to load beta.",
          );
        }

        if (isActive) {
          setState(payload);
          setIsAuthenticated(true);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("accountability.error.generic", "Something went wrong."),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadState();

    return () => {
      isActive = false;
    };
  }, [t]);

  const enrollment = state?.enrollment ?? null;
  const completedPercent = enrollment?.tasks.length
    ? Math.round((enrollment.completedCount / enrollment.tasks.length) * 100)
    : 0;

  async function submitJoin() {
    setError(null);

    if (!joinForm.examDateUnknown && !joinForm.examDate) {
      setError(
        t(
          "accountability.form.examDateRequired",
          "Choose an exam date or select that you have not booked yet.",
        ),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/accountability-beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...joinForm,
          examDate: joinForm.examDateUnknown ? null : joinForm.examDate,
        }),
      });
      const payload = (await response.json()) as AccountabilityResponse | {
        error?: string;
      };

      if (!response.ok || !("enabled" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to join beta.",
        );
      }

      setState(payload);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : t("accountability.error.generic", "Something went wrong."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function patchAction(body: Record<string, unknown>) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/accountability-beta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as AccountabilityResponse | {
        error?: string;
      };

      if (!response.ok || !("enabled" in payload)) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Update failed.",
        );
      }

      setState(payload);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : t("accountability.error.generic", "Something went wrong."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Accountability Beta"
        eyebrowKey="accountability.eyebrow"
        title="7-Day IELTS Accountability Beta"
        titleKey="accountability.title"
        description="Join a small beta group and follow one focused IELTS practice task per day for 7 days."
        descriptionKey="accountability.description"
      />

      {error ? (
        <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <Card aria-busy="true">
          <CardContent className="flex min-h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && state?.enabled === false ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              {t("accountability.disabled.title", "Beta is not open yet")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t(
                "accountability.disabled.description",
                "The 7-day accountability beta is currently closed.",
              )}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && state?.enabled !== false && !isAuthenticated ? (
        <IntroCard
          t={t}
          actions={
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login?redirect=/accountability-beta">
                  {t("accountability.loginCta", "Log in to join")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register?redirect=/accountability-beta">
                  {t("accountability.registerCta", "Create account")}
                </Link>
              </Button>
            </div>
          }
        />
      ) : null}

      {!isLoading && isAuthenticated && state?.enabled !== false && !enrollment ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <IntroCard t={t} />
          <JoinForm
            form={joinForm}
            isSubmitting={isSubmitting}
            setForm={setJoinForm}
            onSubmit={submitJoin}
            t={t}
          />
        </div>
      ) : null}

      {!isLoading && enrollment ? (
        <div className="space-y-6">
          <StatusCard
            enrollment={enrollment}
            completedPercent={completedPercent}
            isSubmitting={isSubmitting}
            onCompleteTask={(taskId) =>
              patchAction({ action: "complete_task", taskId })
            }
            onWithdraw={() => {
              if (
                window.confirm(
                  t(
                    "accountability.withdrawConfirm",
                    "Withdraw from this beta plan?",
                  ),
                )
              ) {
                void patchAction({ action: "withdraw" });
              }
            }}
            t={t}
          />

          <TaskList
            tasks={enrollment.tasks}
            isSubmitting={isSubmitting}
            onCompleteTask={(taskId) =>
              patchAction({ action: "complete_task", taskId })
            }
            t={t}
          />

          {enrollment.status === "completed" ? (
            <FeedbackCard
              feedback={feedback}
              setFeedback={setFeedback}
              isSubmitting={isSubmitting}
              alreadySubmitted={Boolean(enrollment.feedbackRating)}
              onSubmit={() => patchAction({ action: "feedback", feedback })}
              t={t}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IntroCard({
  t,
  actions,
}: {
  t: TFunction;
  actions?: ReactNode;
}) {
  const features = [
    {
      icon: Target,
      title: t("accountability.intro.focus.title", "One focused IELTS task per day"),
      text: t(
        "accountability.intro.focus.text",
        "The plan uses your weakest skill to choose a steady 7-day practice path.",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("accountability.intro.capacity.title", "Limited to 10 active students"),
      text: t(
        "accountability.intro.capacity.text",
        "If the beta is full, you can join the waitlist and be activated manually.",
      ),
    },
    {
      icon: MessageSquareText,
      title: t("accountability.intro.reminder.title", "Manual reminder support"),
      text: t(
        "accountability.intro.reminder.text",
        "Choose Crisp, email, or no reminder. Messages are sent manually by the admin.",
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("accountability.intro.title", "Stay consistent for 7 days")}
        </CardTitle>
        <CardDescription>
          {t(
            "accountability.intro.description",
            "This is a small accountability beta, not an AI coach. Your tasks still use the existing IELTS practice pages and current Free / Pro limits.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <Icon
                className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-slate-950">
                  {feature.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {feature.text}
                </p>
              </div>
            </div>
          );
        })}
        {actions ? <div className="pt-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

function JoinForm({
  form,
  setForm,
  isSubmitting,
  onSubmit,
  t,
}: {
  form: JoinFormState;
  setForm: (form: JoinFormState) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  t: TFunction;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accountability.form.title", "Join the beta")}</CardTitle>
        <CardDescription>
          {t(
            "accountability.form.description",
            "Answer a few questions so we can generate your 7-day plan.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("accountability.form.targetBand", "Target band")}>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={form.targetBand}
              onChange={(event) =>
                setForm({
                  ...form,
                  targetBand: event.target.value as JoinFormState["targetBand"],
                })
              }
            >
              {["6.0", "6.5", "7.0", "7.5", "8.0+"].map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("accountability.form.weakestSkill", "Weakest skill")}>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={form.weakestSkill}
              onChange={(event) =>
                setForm({
                  ...form,
                  weakestSkill: event.target.value as AccountabilitySkill,
                })
              }
            >
              {(
                [
                  "writing",
                  "reading",
                  "listening",
                  "speaking",
                  "not_sure",
                ] as AccountabilitySkill[]
              ).map((skill) => (
                  <option key={skill} value={skill}>
                    {formatSkill(skill, t)}
                  </option>
                ))}
            </select>
          </Field>

          <Field label={t("accountability.form.dailyMinutes", "Daily time")}>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={form.dailyMinutes}
              onChange={(event) =>
                setForm({
                  ...form,
                  dailyMinutes: Number(event.target.value) as JoinFormState["dailyMinutes"],
                })
              }
            >
              {[15, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatMessage(
                    t("accountability.minutes", "{minutes} minutes"),
                    { minutes },
                  )}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("accountability.form.reminder", "Reminder")}>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={form.reminderPreference}
              onChange={(event) =>
                setForm({
                  ...form,
                  reminderPreference: event.target.value as AccountabilityReminderPreference,
                })
              }
            >
              <option value="crisp">Crisp</option>
              <option value="email">Email</option>
              <option value="none">
                {t("accountability.reminder.none", "No reminder")}
              </option>
            </select>
          </Field>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.examDateUnknown}
              onChange={(event) =>
                setForm({
                  ...form,
                  examDateUnknown: event.target.checked,
                  examDate: event.target.checked ? "" : form.examDate,
                })
              }
            />
            {t("accountability.form.noExamDate", "I haven’t booked my exam yet")}
          </label>
          {!form.examDateUnknown ? (
            <div className="mt-4 max-w-xs">
              <Label htmlFor="accountability-exam-date">
                {t("accountability.form.examDate", "Exam date")}
              </Label>
              <Input
                id="accountability-exam-date"
                type="date"
                value={form.examDate}
                onChange={(event) =>
                  setForm({ ...form, examDate: event.target.value })
                }
              />
            </div>
          ) : null}
        </div>

        <Button type="button" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {t("accountability.form.submit", "Join 7-day beta")}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function StatusCard({
  enrollment,
  completedPercent,
  isSubmitting,
  onCompleteTask,
  onWithdraw,
  t,
}: {
  enrollment: AccountabilityEnrollment;
  completedPercent: number;
  isSubmitting: boolean;
  onCompleteTask: (taskId: string) => void;
  onWithdraw: () => void;
  t: TFunction;
}) {
  const todayTask = enrollment.todayTask;
  const isOpen = enrollment.status === "active" || enrollment.status === "waitlisted";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusClass(enrollment.status)}>
                {formatEnrollmentStatus(enrollment.status, t)}
              </Badge>
              <Badge className="bg-white">
                {formatMessage(t("accountability.dayCount", "Day {day} of 7"), {
                  day: enrollment.currentDay || 1,
                })}
              </Badge>
            </div>
            <CardTitle className="mt-3">
              {enrollment.status === "waitlisted"
                ? t("accountability.waitlist.title", "You are on the waitlist")
                : enrollment.status === "completed"
                  ? t("accountability.completed.title", "7-day beta completed")
                  : todayTask?.title ?? t("accountability.plan.title", "Your 7-day plan")}
            </CardTitle>
            <CardDescription className="mt-2">
              {enrollment.status === "waitlisted"
                ? t(
                    "accountability.waitlist.description",
                    "The active beta group is full. We will activate you manually when a spot opens.",
                  )
                : todayTask?.description ??
                  t(
                    "accountability.completed.description",
                    "Thanks for completing the beta. Your feedback helps improve the next version.",
                  )}
            </CardDescription>
          </div>
          {isOpen ? (
            <Button type="button" variant="outline" onClick={onWithdraw}>
              {t("accountability.withdraw", "Withdraw")}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {formatMessage(
                t("accountability.progress", "{completed}/7 completed"),
                { completed: enrollment.completedCount },
              )}
            </span>
            <span>{completedPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-slate-950"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
        </div>

        {todayTask && enrollment.status === "active" ? (
          <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-950">
                {t("accountability.today", "Today’s task")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatSkill(todayTask.skill, t)} ·{" "}
                {formatMessage(
                  t("accountability.minutes", "{minutes} minutes"),
                  { minutes: todayTask.estimatedMinutes },
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={todayTask.targetPath}>
                  {t("accountability.startTask", "Start task")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onCompleteTask(todayTask.id)}
              >
                {t("accountability.markComplete", "Mark complete")}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskList({
  tasks,
  isSubmitting,
  onCompleteTask,
  t,
}: {
  tasks: AccountabilityTask[];
  isSubmitting: boolean;
  onCompleteTask: (taskId: string) => void;
  t: TFunction;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accountability.tasks.title", "Your 7-day task list")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white">
                  {formatMessage(t("accountability.day", "Day {day}"), {
                    day: task.dayNumber,
                  })}
                </Badge>
                <Badge className={getTaskStatusClass(task.status)}>
                  {formatTaskStatus(task.status, t)}
                </Badge>
                <Badge className="bg-slate-50 text-slate-700">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatMessage(
                    t("accountability.minutes", "{minutes} minutes"),
                    { minutes: task.estimatedMinutes },
                  )}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-950">
                {task.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {task.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant={task.locked ? "outline" : "default"}>
                <Link href={task.targetPath}>
                  {t("accountability.openTask", "Open")}
                </Link>
              </Button>
              {!task.completedAt && !task.locked ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => onCompleteTask(task.id)}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t("accountability.markComplete", "Mark complete")}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FeedbackCard({
  feedback,
  setFeedback,
  isSubmitting,
  alreadySubmitted,
  onSubmit,
  t,
}: {
  feedback: FeedbackState;
  setFeedback: (feedback: FeedbackState) => void;
  isSubmitting: boolean;
  alreadySubmitted: boolean;
  onSubmit: () => void;
  t: TFunction;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accountability.feedback.title", "Beta feedback")}</CardTitle>
        <CardDescription>
          {alreadySubmitted
            ? t("accountability.feedback.submitted", "Thanks, your feedback has been saved.")
            : t(
                "accountability.feedback.description",
                "Tell us what helped and what should change before the next beta.",
              )}
        </CardDescription>
      </CardHeader>
      {!alreadySubmitted ? (
        <CardContent className="space-y-4">
          <Field label={t("accountability.feedback.rating", "Rating")}>
            <select
              className="h-10 max-w-xs rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={feedback.rating}
              onChange={(event) =>
                setFeedback({ ...feedback, rating: Number(event.target.value) })
              }
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </Field>
          <TextareaField
            label={t("accountability.feedback.helpedMost", "What helped most?")}
            value={feedback.helpedMost}
            onChange={(helpedMost) => setFeedback({ ...feedback, helpedMost })}
          />
          <TextareaField
            label={t("accountability.feedback.difficulty", "What was difficult?")}
            value={feedback.difficulty}
            onChange={(difficulty) => setFeedback({ ...feedback, difficulty })}
          />
          <Field label={t("accountability.feedback.willingness", "Would you join another beta?")}>
            <select
              className="h-10 max-w-xs rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={feedback.willingness}
              onChange={(event) =>
                setFeedback({
                  ...feedback,
                  willingness: event.target.value as FeedbackState["willingness"],
                })
              }
            >
              <option value="yes">{t("accountability.feedback.yes", "Yes")}</option>
              <option value="maybe">{t("accountability.feedback.maybe", "Maybe")}</option>
              <option value="no">{t("accountability.feedback.no", "No")}</option>
            </select>
          </Field>
          <Button type="button" disabled={isSubmitting} onClick={onSubmit}>
            {t("accountability.feedback.submit", "Submit feedback")}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        value={value}
        maxLength={1000}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatSkill(
  skill: AccountabilityTask["skill"] | AccountabilitySkill,
  t: TFunction,
) {
  return t(`accountability.skill.${skill}`, skill.replace("_", " "));
}

function formatEnrollmentStatus(
  status: AccountabilityEnrollment["status"],
  t: TFunction,
) {
  return t(`accountability.status.${status}`, status);
}

function formatTaskStatus(status: AccountabilityTask["status"], t: TFunction) {
  return t(`accountability.taskStatus.${status}`, status);
}

function getStatusClass(status: AccountabilityEnrollment["status"]) {
  if (status === "active") {
    return "bg-teal-50 text-teal-800";
  }
  if (status === "completed") {
    return "bg-slate-950 text-white";
  }
  if (status === "withdrawn") {
    return "bg-slate-100 text-slate-500";
  }
  return "bg-amber-50 text-amber-800";
}

function getTaskStatusClass(status: AccountabilityTask["status"]) {
  if (status === "completed") {
    return "bg-teal-50 text-teal-800";
  }
  if (status === "today" || status === "available") {
    return "bg-slate-950 text-white";
  }
  return "bg-slate-100 text-slate-500";
}

function formatMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (message, [key, value]) =>
      message.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}
