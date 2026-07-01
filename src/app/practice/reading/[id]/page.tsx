import { notFound } from "next/navigation";

import { getPublishedReadingPracticeSet } from "@/server/services/reading-practice";
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

  return <ReadingPracticeClient readingSet={readingSet} />;
}
