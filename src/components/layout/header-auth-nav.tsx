"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";

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
        aria-label="正在检查登录状态"
        className="h-9 w-40 rounded-md bg-slate-100"
      />
    );
  }

  if (mode !== "supabase" || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">登录</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">
            免费开始
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/profile">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Profile
        </Link>
      </Button>
      {isAdmin ? (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <Shield className="h-4 w-4" aria-hidden="true" />
            Admin
          </Link>
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={signOut}
        disabled={isSigningOut}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {isSigningOut ? "退出中" : "退出"}
      </Button>
    </div>
  );
}
