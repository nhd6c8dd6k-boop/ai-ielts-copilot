"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AuthMode = "loading" | "demo" | "anonymous" | "supabase" | "error";

type SessionUser = {
  email?: string | null;
  displayName?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
};

type SessionResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  user?: SessionUser | null;
};

const planLabels: Record<string, string> = {
  free: "Free",
  pro_monthly: "Pro Monthly",
  pro_yearly: "Pro Yearly",
};

export function AccountStatus() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as SessionResponse;

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setMode("error");
          return;
        }

        setMode(payload.mode ?? "anonymous");
        setUser(payload.user ?? null);
      } catch {
        if (isActive) {
          setMode("error");
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  const displayName = user?.displayName || user?.email || "IELTS Candidate";
  const planLabel = useMemo(() => {
    if (mode === "demo") {
      return "Demo";
    }

    const plan = user?.plan ?? "free";

    return planLabels[plan] ?? plan;
  }, [mode, user?.plan]);

  const signOut = async () => {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.href = "/";
    } catch {
      setIsSigningOut(false);
      setMode("error");
    }
  };

  if (mode === "loading") {
    return null;
  }

  if (mode === "anonymous" || mode === "error") {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500">
          {mode === "error"
            ? t("auth.statusUnavailable", "Account status is temporarily unavailable")
            : t("auth.localRecords", "Not signed in, using local records")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/login">{t("auth.signIn", "Sign in")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t("auth.register", "Register")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-950">
            {displayName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {mode === "demo" ? t("auth.demoAccount", "Demo account") : user?.email}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge className="bg-white">{planLabel}</Badge>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={signOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isSigningOut
            ? t("nav.signingOut", "Signing out")
            : t("nav.signOut", "Sign out")}
        </Button>
      </div>
    </div>
  );
}
