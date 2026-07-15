import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { UsageLimitNotice } from "@/components/practice/usage-limit-notice";
import { getCurrentUserId } from "@/server/services/auth-session";
import { getPublishedReadingPracticeSet } from "@/server/services/reading-practice";
import { canStartReadingSet } from "@/server/services/usage-limits";
import { ReadingPracticeClient } from "./reading-practice-client";

type ReadingPracticeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReadingPracticeDetailPage({
  params,
}: ReadingPracticeDetailPageProps) {
  const { id } = await params;
  const readingSet = await getPublishedReadingPracticeSet(id);

  if (!readingSet) {
    notFound();
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return <SignInToPractice returnTo={`/practice/reading/${id}`} />;
  }

  const usageDecision = await canStartReadingSet(userId, id);

  if (!usageDecision.allowed) {
    return <UsageLimitNotice resource="reading" />;
  }

  return (
    <ReadingPracticeClient
      readingSet={readingSet}
      usageDecision={usageDecision}
    />
  );
}
