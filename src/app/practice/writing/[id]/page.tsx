import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { env } from "@/lib/env";
import { getCurrentUserId } from "@/server/services/auth-session";
import { canSubmitWritingFeedback } from "@/server/services/usage-limits";
import { getPublishedWritingTask } from "@/server/services/writing-practice";
import { WritingPracticeClient } from "./writing-practice-client";

type WritingPracticeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WritingPracticeDetailPage({
  params,
}: WritingPracticeDetailPageProps) {
  const { id } = await params;
  const task = await getPublishedWritingTask(id);

  if (!task) {
    notFound();
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return <SignInToPractice returnTo={`/practice/writing/${id}`} />;
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
