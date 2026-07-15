"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";

const betaRewardDismissedKey = "ai-ielts-beta-reward-modal-dismissed";
const dismissDurationMs = 7 * 24 * 60 * 60 * 1000;

function shouldShowRewardModal() {
  const dismissedAt = window.localStorage.getItem(betaRewardDismissedKey);

  if (!dismissedAt) {
    return true;
  }

  const dismissedTime = Number(dismissedAt);

  if (!Number.isFinite(dismissedTime)) {
    return true;
  }

  return Date.now() - dismissedTime > dismissDurationMs;
}

export function BetaRewardModal() {
  const router = useRouter();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(betaRewardDismissedKey, String(Date.now()));
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsOpen(shouldShowRewardModal());
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6"
      role="dialog"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label={t("betaRewardModal.close", "Close reward modal")}
          className="absolute right-3 top-3 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          type="button"
          onClick={dismiss}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2 className="mt-5 pr-8 text-2xl font-semibold tracking-tight text-slate-950">
          {t("betaRewardModal.title", "Early user reward 🎁")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {t(
            "betaRewardModal.body",
            "The first 10 users who register and complete a practice will receive one month of Pro access. Eligible users will be activated manually.",
          )}
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {t(
            "betaRewardModal.smallText",
            "Start with free IELTS practice. Your feedback helps us improve the practice experience.",
          )}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:flex-1"
            type="button"
            onClick={() => {
              dismiss();
              router.push("/practice");
            }}
          >
            {t("betaRewardModal.primary", "Start practicing")}
          </Button>
          <Button
            className="w-full sm:flex-1"
            type="button"
            variant="outline"
            onClick={dismiss}
          >
            {t("betaRewardModal.secondary", "Maybe later")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { betaRewardDismissedKey };
