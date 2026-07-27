"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CreditCard,
  Home,
  LayoutDashboard,
  LibraryBig,
  LifeBuoy,
  LogOut,
  Menu,
  Shield,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

type MobileMenuItem = {
  href: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
};

const publicMenuItems: MobileMenuItem[] = [
  { href: "/", labelKey: "nav.home", fallback: "Home", icon: Home },
  { href: "/practice", labelKey: "nav.practice", fallback: "Practice", icon: LibraryBig },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Plans", icon: CreditCard },
  { href: "/support", labelKey: "nav.support", fallback: "Support", icon: LifeBuoy },
  {
    href: "/demo/writing-feedback",
    labelKey: "nav.sampleFeedback",
    fallback: "Sample Feedback",
    icon: ArrowRight,
  },
];

export function HeaderAuthNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [mode, setMode] = useState<AuthMode>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const signOut = async () => {
    setIsSigningOut(true);
    setIsMenuOpen(false);

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
      <>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.open", "Open navigation")}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-marketing-nav"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
        <MarketingMobileMenu
          isOpen={isMenuOpen}
          title={t("nav.navigation", "Navigation")}
          items={publicMenuItems}
          pathname={pathname}
          onClose={() => setIsMenuOpen(false)}
          footer={null}
        />
      </>
    );
  }

  if (mode !== "supabase" || !user) {
    return (
      <>
        <div className="hidden min-w-0 items-center gap-1 lg:flex lg:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("nav.login", "Log in")}</Link>
          </Button>
          <Button asChild size="sm" className="px-3">
            <Link href="/register" aria-label={t("nav.register", "Start free")}>
              {t("nav.register", "Start free")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.open", "Open navigation")}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-marketing-nav"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
        <MarketingMobileMenu
          isOpen={isMenuOpen}
          title={t("nav.navigation", "Navigation")}
          items={publicMenuItems}
          pathname={pathname}
          onClose={() => setIsMenuOpen(false)}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.login", "Log in")}
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  {t("nav.register", "Start free")}
                </Link>
              </Button>
            </div>
          }
        />
      </>
    );
  }

  const isAdmin = user.role === "admin";
  const accountMenuItems = isAdmin
    ? [
        ...publicMenuItems,
        {
          href: "/dashboard",
          labelKey: "nav.dashboard",
          fallback: "Dashboard",
          icon: LayoutDashboard,
        },
        { href: "/profile", labelKey: "nav.profile", fallback: "Profile", icon: UserRound },
        { href: "/admin", labelKey: "nav.admin", fallback: "Admin", icon: Shield },
      ]
    : [
        ...publicMenuItems,
        {
          href: "/dashboard",
          labelKey: "nav.dashboard",
          fallback: "Dashboard",
          icon: LayoutDashboard,
        },
        { href: "/profile", labelKey: "nav.profile", fallback: "Profile", icon: UserRound },
      ];

  return (
    <>
      <div className="hidden min-w-0 items-center gap-1 lg:flex lg:gap-2">
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label={t("nav.open", "Open navigation")}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-marketing-nav"
        onClick={() => setIsMenuOpen(true)}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </Button>
      <MarketingMobileMenu
        isOpen={isMenuOpen}
        title={t("nav.navigation", "Navigation")}
        items={accountMenuItems}
        pathname={pathname}
        onClose={() => setIsMenuOpen(false)}
        footer={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={signOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {isSigningOut
              ? t("nav.signingOut", "Signing out")
              : t("nav.signOut", "Sign out")}
          </Button>
        }
      />
    </>
  );
}

function MarketingMobileMenu({
  isOpen,
  title,
  items,
  pathname,
  footer,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  items: MobileMenuItem[];
  pathname: string;
  footer: ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      id="mobile-marketing-nav"
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-slate-950/40"
        aria-label={t("nav.close", "Close navigation")}
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <span className="text-sm font-semibold text-slate-950">{title}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("nav.close", "Close navigation")}
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
                  "hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  isActive
                    ? "border-slate-950 font-semibold text-slate-950"
                    : "border-transparent text-slate-600",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(item.labelKey, item.fallback)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-slate-200 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom)+5rem)]">
          <LanguageSwitcher variant="menu" />
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}
