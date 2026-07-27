import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import { getCurrentUserId } from "@/server/services/auth-session";
import { canSubmitWritingFeedback } from "@/server/services/usage-limits";
import {
  getPublishedWritingTaskBySlugOrId,
} from "@/server/services/writing-practice";
import { WritingPracticeClient } from "./writing-practice-client";

type WritingPracticeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: WritingPracticeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedWritingTaskBySlugOrId(slug);

  if (!result) {
    return {
      title: "IELTS Writing Practice",
    };
  }

  const { task } = result;
  const title = `${task.title} | IELTS Writing Task ${task.taskType} Practice`;
  const description = `Practice IELTS Writing Task ${task.taskType} on ${task.topic} online and get AI-powered feedback after you submit your response.`;
  const url = absoluteUrl(`/practice/writing/${task.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function WritingPracticeDetailPage({
  params,
}: WritingPracticeDetailPageProps) {
  const { slug } = await params;
  const result = await getPublishedWritingTaskBySlugOrId(slug);

  if (!result) {
    notFound();
  }

  const { task, shouldRedirect } = result;

  if (shouldRedirect) {
    permanentRedirect(`/practice/writing/${task.slug}`);
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return <SignInToPractice returnTo={`/practice/writing/${task.slug}`} />;
  }

  const usageDecision = await canSubmitWritingFeedback(userId);

  return (
    <WritingPracticeClient
      task={task}
      isAiFeedbackAvailable={Boolean(env.openaiApiKey)}
      usageDecision={usageDecision}
    />
  );
}
