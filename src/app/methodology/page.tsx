import type { Metadata } from "next";

import { MethodologyPageClient } from "@/app/methodology/methodology-page-client";
import { absoluteUrl, siteName } from "@/lib/seo";

const title = "IELTS Practice Methodology | AI IELTS Copilot";
const description =
  "Learn how AI IELTS Copilot produces criteria-based Writing feedback, reviews practice content and creates Listening audio.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: absoluteUrl("/methodology"),
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/methodology"),
    siteName,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function MethodologyPage() {
  return <MethodologyPageClient />;
}
