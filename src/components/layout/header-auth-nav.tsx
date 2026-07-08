"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "loading" | "demo" | "anonymous" | "supabase" | "error";

type SessionUser = {
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
};

type SessionResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  user?: SessionUser | null;
};

export function HeaderAuthNav() {
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
          setUser(null);
          return;
        }

        setMode(payload.mode ?? "anonymous");
        setUser(payload.user ?? null);
      } catch {
        if (isActive) {
          setMode("error");
          setUser(null);
        }
      }
    }

    if (!isSupabaseConfigured()) {
      void loadSession();

      return () => {
        isActive = false;
      };
    }

    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (!isActive) {
        return;
      }

      if (!data.session) {
        setMode("anonymous");
        setUser(null);
        return;
      }

      void loadSession();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      if (!session) {
        setMode("anonymous");
        setUser(null);
        return;
      }

      void loadSession();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsSigningOut(true);

    try {
      if (isSupabaseConfigured()) {
        await createSupabaseBrowserClient().auth.signOut();
      }

      await fetch("/api/auth/sign-out", { method: "POST" });
      setMode("anonymous");
      setUser(null);
      window.location.href = "/";
    } catch {
      setIsSigningOut(false);
      setMode("error");
    }
  };

  if (mode === "loading") {
    return (
      <div
        aria-label={t("nav.login", "Checking sign-in status")}
        className="h-9 w-20 rounded-md bg-slate-100 sm:w-40"
      />
    );
  }

  if (mode !== "supabase" || !user) {
    return (
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden min-[390px]:inline-flex">
          <Link href="/login">{t("nav.login", "Log in")}</Link>
        </Button>
        <Button asChild size="sm" className="px-2 sm:px-3">
          <Link href="/register" aria-label={t("nav.register", "Start free")}>
            <span className="hidden min-[430px]:inline">
              {t("nav.register", "Start free")}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-2">
      <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
        <Link href="/dashboard" aria-label={t("nav.dashboard", "Dashboard")}>
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[520px]:inline">
            {t("nav.dashboard", "Dashboard")}
          </span>
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/profile">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {t("nav.profile", "Profile")}
        </Link>
      </Button>
      {isAdmin ? (
        <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
          <Link href="/admin" aria-label={t("nav.admin", "Admin")}>
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[520px]:inline">
              {t("nav.admin", "Admin")}
            </span>
          </Link>
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={signOut}
        disabled={isSigningOut}
        aria-label={
          isSigningOut
            ? t("nav.signingOut", "Signing out")
            : t("nav.signOut", "Sign out")
        }
        className="px-2 sm:px-3"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden min-[520px]:inline">
          {isSigningOut
            ? t("nav.signingOut", "Signing out")
            : t("nav.signOut", "Sign out")}
        </span>
      </Button>
    </div>
  );
}
