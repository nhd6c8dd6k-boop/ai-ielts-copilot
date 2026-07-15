import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { UsageLimitNotice } from "@/components/practice/usage-limit-notice";
import { getCurrentUserId } from "@/server/services/auth-session";
import { getPublishedListeningPracticeSet } from "@/server/services/listening-practice";
import { canStartListeningSet } from "@/server/services/usage-limits";
import { ListeningPracticeClient } from "./listening-practice-client";

type ListeningPracticeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListeningPracticeDetailPage({
  params,
}: ListeningPracticeDetailPageProps) {
  const { id } = await params;
  const listeningSet = await getPublishedListeningPracticeSet(id);

  if (!listeningSet) {
    notFound();
  }

  const userId = await getCurrentUserId();

  if (!userId) {
    return <SignInToPractice returnTo={`/practice/listening/${id}`} />;
  }

  const usageDecision = await canStartListeningSet(userId, id);

  if (!usageDecision.allowed) {
    return <UsageLimitNotice resource="listening" />;
  }

  return (
    <ListeningPracticeClient
      listeningSet={listeningSet}
      usageDecision={usageDecision}
    />
  );
}
