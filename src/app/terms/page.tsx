import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use | AI IELTS Copilot",
  description:
    "Terms of Use for AI IELTS Copilot users, including service limits, original practice content, AI feedback disclaimers, and user responsibilities.",
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
