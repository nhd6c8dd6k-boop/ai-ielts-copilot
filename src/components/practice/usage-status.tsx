"use client";

import Link from "next/link";
import { Crown, LockKeyhole, Sparkles } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UsageStatusProps =
  | {
      resource: "reading" | "listening";
      isSignedIn: boolean;
      used?: number;
      limit?: number | null;
      unlimited?: boolean;
      className?: string;
      detail?: "list" | "practice";
      isRepeatSet?: boolean;
      locked?: boolean;
    }
  | {
      resource: "writing";
      isSignedIn: boolean;
      usedToday?: number;
      limitToday?: number | null;
      unlimited?: boolean;
      className?: string;
      detail?: "list" | "practice";
      locked?: boolean;
    };

export function UsageStatus(props: UsageStatusProps) {
  const { t } = useI18n();
  const title = getUsageTitle(props.resource, t);

  if (!props.isSignedIn) {
    return (
      <div className={cn(cardClassName(false), props.className)}>
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <div>
            <p className="font-medium text-slate-950">{title}</p>
            <p className="mt-1 text-slate-600">
              {getSignedOutMessage(props.resource, t)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (props.unlimited) {
    return (
      <div className={cn(cardClassName(false), props.className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-slate-950">{title}</p>
            <p className="mt-1 text-slate-600">
              {props.resource === "writing"
                ? t("usage.unlimited", "Unlimited")
                : t("usage.proUnlimited", "Unlimited practice")}
            </p>
          </div>
          <Badge className="bg-teal-50 text-teal-800">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            {t("usage.unlimited", "Unlimited")}
          </Badge>
        </div>
      </div>
    );
  }

  if (props.resource === "writing") {
    const used = props.usedToday ?? 0;
    const limit = props.limitToday ?? 1;
    const isLocked = Boolean(props.locked || used >= limit);

    return (
      <div className={cn(cardClassName(isLocked), props.className)}>
        <UsageHeader title={title} locked={isLocked} />
        <p className="mt-1 text-slate-600">
          {t("usage.writingUsed", "{used} / {limit} used")
            .replace("{used}", String(used))
            .replace("{limit}", String(limit))}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {t("usage.resetsDaily", "Resets daily at 00:00 UTC")}
        </p>
        {isLocked ? <UpgradeActions resource="writing" isProLimit={limit > 1} /> : null}
      </div>
    );
  }

  const used = props.used ?? 0;
  const limit = props.limit ?? 5;
  const isLocked = Boolean(props.locked || used >= limit);
  const remaining = Math.max(0, limit - used);

  return (
    <div className={cn(cardClassName(isLocked && !props.isRepeatSet), props.className)}>
      <UsageHeader title={title} locked={isLocked && !props.isRepeatSet} />
      <p className="mt-1 text-slate-600">
        {used > limit
          ? t("usage.practiceOverLimit", "{used} completed · Free limit {limit}")
              .replace("{used}", String(used))
              .replace("{limit}", String(limit))
          : t("usage.practiceUsed", "{used} / {limit} different practice sets completed")
              .replace("{used}", String(used))
              .replace("{limit}", String(limit))}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {props.isRepeatSet
          ? t(
              "usage.repeatSet",
              "This set can be practised again without using another slot.",
            )
          : props.detail === "practice"
            ? t("usage.remainingNewSets", "Remaining: {count} new sets").replace(
                "{count}",
                String(remaining),
              )
            : getPracticeUsageHint(props.resource, t)}
      </p>
      {isLocked && !props.isRepeatSet ? (
        <UpgradeActions resource={props.resource} />
      ) : null}
    </div>
  );
}

function UsageHeader({
  title,
  locked,
}: {
  title: string;
  locked: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-medium text-slate-950">{title}</p>
      {locked ? (
        <Badge className="border-amber-200 bg-amber-50 text-amber-800">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          {t("usage.limitReached", "Limit reached")}
        </Badge>
      ) : null}
    </div>
  );
}

function UpgradeActions({
  resource,
  isProLimit = false,
}: {
  resource: "reading" | "listening" | "writing";
  isProLimit?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <Button asChild size="sm" variant="outline">
        <Link href="/pricing">{t("usage.viewPro", "View Pro")}</Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href="/support">
          {isProLimit
            ? t("usage.contactSupport", "Contact support")
            : t("usage.contactUpgrade", "Contact to upgrade")}
        </Link>
      </Button>
      <span className="sr-only">{resource}</span>
    </div>
  );
}

function cardClassName(isLocked: boolean) {
  return cn(
    "mb-5 rounded-md border px-4 py-3 text-sm leading-6",
    isLocked
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-teal-200 bg-teal-50 text-teal-950",
  );
}

function getUsageTitle(
  resource: "reading" | "listening" | "writing",
  t: (key: string, fallback: string) => string,
) {
  if (resource === "reading") {
    return t("usage.readingTitle", "Reading usage");
  }

  if (resource === "listening") {
    return t("usage.listeningTitle", "Listening usage");
  }

  return t("usage.writingTitle", "Today's AI Writing feedback");
}

function getSignedOutMessage(
  resource: "reading" | "listening" | "writing",
  t: (key: string, fallback: string) => string,
) {
  if (resource === "reading") {
    return t(
      "usage.readingSignedOut",
      "Sign in to complete any 5 Reading practice sets for free.",
    );
  }

  if (resource === "listening") {
    return t(
      "usage.listeningSignedOut",
      "Sign in to complete any 5 Listening practice sets for free.",
    );
  }

  return t(
    "usage.writingSignedOut",
    "Sign in to get AI Writing feedback.",
  );
}

function getPracticeUsageHint(
  resource: "reading" | "listening",
  t: (key: string, fallback: string) => string,
) {
  if (resource === "reading") {
    return t(
      "usage.readingHint",
      "Choose any set. Repeating a completed set does not use another slot.",
    );
  }

  return t(
    "usage.listeningHint",
    "Repeating a completed set does not use another slot.",
  );
}
