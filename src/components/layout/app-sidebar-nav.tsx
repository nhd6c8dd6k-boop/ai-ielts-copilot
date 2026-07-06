"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  Shield,
  UserRound,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SessionResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  user?: {
    role?: string | null;
  } | null;
};

const baseNavItems = [
  { href: "/practice", labelKey: "nav.practice", fallback: "Practice", icon: LibraryBig },
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    fallback: "Dashboard",
    icon: LayoutDashboard,
  },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Pricing", icon: CreditCard },
  { href: "/profile", labelKey: "nav.profile", fallback: "Profile", icon: UserRound },
];

export function AppSidebarNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadRole() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json()) as SessionResponse;

        if (isActive && response.ok) {
          setIsAdmin(payload.user?.role === "admin");
        }
      } catch {
        if (isActive) {
          setIsAdmin(false);
        }
      }
    }

    void loadRole();

    if (!isSupabaseConfigured()) {
      return () => {
        isActive = false;
      };
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { href: "/admin", labelKey: "nav.admin", fallback: "Admin", icon: Shield },
      ]
    : baseNavItems;

  return (
    <nav className="mt-8 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(item.labelKey, item.fallback)}
          </Link>
        );
      })}
    </nav>
  );
}
