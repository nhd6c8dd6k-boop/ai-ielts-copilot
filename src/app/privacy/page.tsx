import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | AI IELTS Copilot",
  description:
    "Privacy Policy for AI IELTS Copilot beta users, including account data, practice records, AI feedback, and support contact information.",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
