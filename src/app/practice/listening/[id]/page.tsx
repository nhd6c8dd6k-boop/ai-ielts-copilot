import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { isUserSignedIn } from "@/server/services/auth-session";
import { getPublishedListeningPracticeSet } from "@/server/services/listening-practice";
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

  if (!(await isUserSignedIn())) {
    return <SignInToPractice returnTo={`/practice/listening/${id}`} />;
  }

  return <ListeningPracticeClient listeningSet={listeningSet} />;
}
