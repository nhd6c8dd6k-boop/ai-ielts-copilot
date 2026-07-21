import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/seo";
import { SpeakingPartPage } from "../speaking-part-page";

export const metadata: Metadata = {
  title: "IELTS Speaking Part 1 Topics | AI IELTS Copilot",
  description:
    "Practise IELTS-style Speaking Part 1 questions with sample answers, phrases, vocabulary, and common mistakes.",
  alternates: {
    canonical: absoluteUrl("/practice/speaking/part-1"),
  },
};

export const dynamic = "force-dynamic";

export default function SpeakingPart1Page() {
  return <SpeakingPartPage part={1} />;
}
