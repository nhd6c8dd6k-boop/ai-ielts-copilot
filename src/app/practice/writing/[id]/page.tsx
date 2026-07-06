import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { env } from "@/lib/env";
import { isUserSignedIn } from "@/server/services/auth-session";
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

  if (!(await isUserSignedIn())) {
    return <SignInToPractice returnTo={`/practice/writing/${id}`} />;
  }

  return (
    <WritingPracticeClient
      task={task}
      isAiFeedbackAvailable={Boolean(env.openaiApiKey)}
    />
  );
}
