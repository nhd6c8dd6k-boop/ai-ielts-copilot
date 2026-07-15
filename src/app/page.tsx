import type { Metadata } from "next";

import { absoluteUrl, siteDescription, siteName } from "@/lib/seo";

import HomePageClient from "./home-page-client";

export const metadata: Metadata = {
  title: "AI IELTS Copilot | IELTS Practice with AI Feedback",
  description: siteDescription,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "AI IELTS Copilot | IELTS Practice with AI Feedback",
    description: siteDescription,
    url: absoluteUrl("/"),
    siteName,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AI IELTS Copilot | IELTS Practice with AI Feedback",
    description: siteDescription,
  },
};

export default function Home() {
  return <HomePageClient />;
}
