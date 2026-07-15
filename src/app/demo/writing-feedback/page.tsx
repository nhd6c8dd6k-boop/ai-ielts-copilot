import type { Metadata } from "next";

import { WritingSampleFeedbackPage } from "@/components/marketing/writing-sample-feedback";

export const metadata: Metadata = {
  title: "IELTS Writing AI Feedback Example | AI IELTS Copilot",
  description:
    "View a sample IELTS Writing feedback report with criterion scores, task-specific analysis, sentence rewrites, grammar feedback, and practical next steps.",
  alternates: {
    canonical: "https://www.aiieltscopilot.com/demo/writing-feedback",
  },
  openGraph: {
    title: "IELTS Writing AI Feedback Example | AI IELTS Copilot",
    description:
      "View a sample IELTS Writing feedback report with criterion scores, task-specific analysis, sentence rewrites, grammar feedback, and practical next steps.",
    url: "https://www.aiieltscopilot.com/demo/writing-feedback",
    siteName: "AI IELTS Copilot",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "IELTS Writing AI Feedback Example | AI IELTS Copilot",
    description:
      "View a sample IELTS Writing feedback report with criterion scores, task-specific analysis, sentence rewrites, grammar feedback, and practical next steps.",
  },
};

export default function DemoWritingFeedbackPage() {
  return <WritingSampleFeedbackPage />;
}
