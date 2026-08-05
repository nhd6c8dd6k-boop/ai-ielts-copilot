import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { AccountabilityBetaClient } from "./accountability-beta-client";

export const metadata: Metadata = {
  title: "7-Day IELTS Accountability Beta",
  description:
    "Join a small 7-day IELTS accountability beta with daily practice tasks and manual reminder support.",
  alternates: {
    canonical: "/accountability-beta",
  },
  openGraph: {
    title: "7-Day IELTS Accountability Beta",
    description:
      "Join a small 7-day IELTS accountability beta with daily practice tasks and manual reminder support.",
    url: "/accountability-beta",
  },
};

export default function AccountabilityBetaPage() {
  return (
    <AppShell>
      <AccountabilityBetaClient />
    </AppShell>
  );
}
