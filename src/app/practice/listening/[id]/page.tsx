import { notFound } from "next/navigation";

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

  return <ListeningPracticeClient listeningSet={listeningSet} />;
}
