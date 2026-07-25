"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { Button } from "@/components/ui/button";
import { ContactToUpgradeButton } from "@/features/payments/contact-to-upgrade-button";

type PricingViewerStatus = "loading" | "anonymous" | "free" | "pro";

type PricingSessionResponse = {
  user?: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
};

const PricingViewerContext = createContext<PricingViewerStatus>("loading");

export function PricingPlanActionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<PricingViewerStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Session request failed.");
        }

        const payload = (await response.json()) as PricingSessionResponse;
        const nextStatus = payload.user
          ? isProSession(payload.user)
            ? "pro"
            : "free"
          : "anonymous";

        if (isActive) {
          setStatus(nextStatus);
        }
      } catch {
        if (isActive && !controller.signal.aborted) {
          setStatus("anonymous");
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const value = useMemo(() => status, [status]);

  return (
    <PricingViewerContext.Provider value={value}>
      {children}
    </PricingViewerContext.Provider>
  );
}

export function PricingFreePlanAction() {
  const viewerStatus = useContext(PricingViewerContext);

  if (viewerStatus === "loading") {
    return (
      <Button className="mt-8 w-full" disabled>
        <LocalizedText k="pricing.checkingPlan" fallback="Checking plan" />
      </Button>
    );
  }

  if (viewerStatus === "free") {
    return (
      <Button className="mt-8 w-full" disabled>
        <LocalizedText k="pricing.currentPlan" fallback="Current plan" />
      </Button>
    );
  }

  if (viewerStatus === "pro") {
    return (
      <Button asChild className="mt-8 w-full" variant="outline">
        <Link href="/practice">
          <LocalizedText
            k="pricing.continuePractice"
            fallback="Continue practising"
          />
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild className="mt-8 w-full">
      <Link href="/register?redirect=/practice/writing">
        <LocalizedText k="pricing.startPracticing" fallback="Start free" />
      </Link>
    </Button>
  );
}

export function PricingProPlanAction({ plan }: { plan: "monthly" | "yearly" }) {
  const viewerStatus = useContext(PricingViewerContext);

  if (viewerStatus === "loading") {
    return (
      <Button className="mt-6 w-full" disabled>
        <LocalizedText k="pricing.checkingPlan" fallback="Checking plan" />
      </Button>
    );
  }

  if (viewerStatus === "pro") {
    return (
      <Button className="mt-6 w-full" disabled>
        <LocalizedText k="pricing.currentPlan" fallback="Current plan" />
      </Button>
    );
  }

  return (
    <>
      <ContactToUpgradeButton plan={plan} className="mt-6 w-full" />
      <p className="mt-3 text-xs leading-5 text-slate-500">
        <LocalizedText
          k="pricing.noAutoActivation"
          fallback="This button opens live chat. It does not automatically activate Pro or start Stripe Checkout."
        />
      </p>
    </>
  );
}

function isProSession(user: NonNullable<PricingSessionResponse["user"]>) {
  const plan = String(user.plan ?? "free");
  const status = String(user.subscriptionStatus ?? "incomplete");
  const expiresAt = user.currentPeriodEnd;

  if (!["pro", "pro_monthly", "pro_yearly"].includes(plan)) {
    return false;
  }

  if (!["active", "trialing"].includes(status)) {
    return false;
  }

  if (!expiresAt) {
    return true;
  }

  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry > Date.now();
}
