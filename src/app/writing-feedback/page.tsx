import type { Metadata } from "next";

import { WritingFeedbackLanding } from "@/components/marketing/writing-feedback-landing";
import { absoluteUrl, siteName } from "@/lib/seo";

const title = "Free IELTS Writing Feedback | AI IELTS Copilot";
const description =
  "Practise IELTS Writing online and receive detailed AI feedback with an estimated band score in minutes.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: absoluteUrl("/writing-feedback"),
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/writing-feedback"),
    siteName,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function WritingFeedbackPage() {
  return <WritingFeedbackLanding />;
}
