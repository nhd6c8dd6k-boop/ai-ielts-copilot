import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/seo";
import { SpeakingPartPage } from "../speaking-part-page";

export const metadata: Metadata = {
  title: "IELTS Speaking Part 3 Topics | AI IELTS Copilot",
  description:
    "Practise IELTS-style Speaking Part 3 discussion questions with developed opinions, examples, and sample answers.",
  alternates: {
    canonical: absoluteUrl("/practice/speaking/part-3"),
  },
};

export const dynamic = "force-dynamic";

export default function SpeakingPart3Page() {
  return <SpeakingPartPage part={3} />;
}
