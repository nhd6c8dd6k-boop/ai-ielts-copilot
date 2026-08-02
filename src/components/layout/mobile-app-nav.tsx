"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Shield,
  UserRound,
  X,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { PracticeMobileAccordion } from "@/components/layout/practice-navigation";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SessionResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  user?: {
    role?: string | null;
  } | null;
};

type AuthMode = "loading" | "demo" | "anonymous" | "supabase" | "error";

const baseItems = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    fallback: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/methodology",
    labelKey: "nav.methodology",
    fallback: "Methodology",
    icon: BookOpenText,
  },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Pricing", icon: CreditCard },
  { href: "/profile", labelKey: "nav.profile", fallback: "Profile", icon: UserRound },
];

const supportItem = {
  href: "/support",
  labelKey: "nav.support",
  fallback: "Support",
  icon: LifeBuoy,
};

const publicItems = [
  {
    href: "/methodology",
    labelKey: "nav.methodology",
    fallback: "Methodology",
    icon: BookOpenText,
  },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Pricing", icon: CreditCard },
  supportItem,
];

export function MobileAppNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("loading");
  const [isAdmin, setIsAdmin] = useState(false);
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
          setIsAdmin(false);
          return;
        }

        const nextMode = payload.mode ?? "anonymous";
        setMode(nextMode);
        setIsAdmin(nextMode === "supabase" && payload.user?.role === "admin");
      } catch {
        if (isActive) {
          setMode("error");
          setIsAdmin(false);
        }
      }
    }

    void loadSession();

    if (!isSupabaseConfigured()) {
      return () => {
        isActive = false;
      };
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isAuthenticated = mode === "supabase";
  const closeAfterNavigationStarts = () => {
    window.setTimeout(() => setIsOpen(false), 0);
  };

  const signOut = async () => {
    setIsSigningOut(true);

    try {
      if (isSupabaseConfigured()) {
        await createSupabaseBrowserClient().auth.signOut();
      }

      await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.href = "/";
    } catch {
      setIsSigningOut(false);
    }
  };

  const navItems = isAuthenticated
    ? isAdmin
      ? [
          ...baseItems,
          { href: "/admin", labelKey: "nav.admin", fallback: "Admin", icon: Shield },
          supportItem,
        ]
      : [...baseItems, supportItem]
    : publicItems;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label={t("nav.open", "Open navigation")}
        aria-expanded={isOpen}
        aria-controls="mobile-app-nav"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {isOpen ? (
        <div
          id="mobile-app-nav"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.navigation", "Navigation")}
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/40"
            aria-label={t("nav.close", "Close navigation")}
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <span className="text-sm font-semibold text-slate-950">
                {t("nav.navigation", "Navigation")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("nav.close", "Close navigation")}
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              <PracticeMobileAccordion
                pathname={pathname}
                onNavigate={closeAfterNavigationStarts}
                className="mb-1"
              />
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAfterNavigationStarts}
                    className={cn(
                      "flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "border-teal-600 bg-teal-50 font-semibold text-slate-950"
                        : "border-transparent text-slate-600 hover:text-slate-950",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(item.labelKey, item.fallback)}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3 border-t border-slate-200 px-4 py-4">
              <LanguageSwitcher variant="menu" onSelect={() => setIsOpen(false)} />
              {mode === "loading" ? null : isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={signOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {isSigningOut
                    ? t("nav.signingOut", "Signing out")
                    : t("nav.signOut", "Sign out")}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login" onClick={closeAfterNavigationStarts}>
                      {t("nav.login", "Log in")}
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register" onClick={closeAfterNavigationStarts}>
                      {t("nav.register", "Start free")}
                    </Link>
                  </Button>
                </div>
              )}
              <p className="text-xs leading-5 text-slate-500">
                AI IELTS Copilot
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
