import { notFound } from "next/navigation";

import { env } from "@/lib/env";
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

  return (
    <WritingPracticeClient
      task={task}
      isAiFeedbackAvailable={Boolean(env.openaiApiKey)}
    />
  );
}
