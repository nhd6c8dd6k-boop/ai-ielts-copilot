"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UsageLimitNoticeProps = {
  resource: "reading" | "listening" | "writing";
  isProLimit?: boolean;
};

export function UsageLimitNotice({
  resource,
  isProLimit = false,
}: UsageLimitNoticeProps) {
  const { t } = useI18n();

  return (
    <AppShell>
      <Card>
        <CardContent className="flex min-h-[520px] items-center justify-center px-4 py-12">
          <div className="max-w-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <Badge className="mt-5 border-amber-200 bg-amber-50 text-amber-800">
              {t("usage.limitReached", "Limit reached")}
            </Badge>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              {getTitle(resource, t)}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {getDescription(resource, isProLimit, t)}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/pricing">{t("usage.viewPro", "View Pro")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/support">
                  {t("usage.contactUpgrade", "Contact to upgrade")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function getTitle(
  resource: "reading" | "listening" | "writing",
  t: (key: string, fallback: string) => string,
) {
  if (resource === "reading") {
    return t(
      "usage.readingLimitTitle",
      "You've completed your 5 free Reading practice sets.",
    );
  }

  if (resource === "listening") {
    return t(
      "usage.listeningLimitTitle",
      "You've completed your 5 free Listening practice sets.",
    );
  }

  return t(
    "usage.writingLimitTitle",
    "You've used today's AI Writing feedback allowance.",
  );
}

function getDescription(
  resource: "reading" | "listening" | "writing",
  isProLimit: boolean,
  t: (key: string, fallback: string) => string,
) {
  if (resource === "reading") {
    return t(
      "usage.readingLimitDescription",
      "You can still repeat completed sets. Upgrade to Pro for unlimited access to new Reading sets.",
    );
  }

  if (resource === "listening") {
    return t(
      "usage.listeningLimitDescription",
      "You can still repeat completed sets. Upgrade to Pro for unlimited access to new Listening sets.",
    );
  }

  return isProLimit
    ? t(
        "usage.writingProLimitDescription",
        "Your allowance resets daily.",
      )
    : t(
        "usage.writingLimitDescription",
        "Upgrade to Pro for up to 10 AI Writing feedbacks per day.",
      );
}
