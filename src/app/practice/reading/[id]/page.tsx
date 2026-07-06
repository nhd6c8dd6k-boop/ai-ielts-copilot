import { notFound } from "next/navigation";

import { SignInToPractice } from "@/components/practice/sign-in-to-practice";
import { isUserSignedIn } from "@/server/services/auth-session";
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

  if (!(await isUserSignedIn())) {
    return <SignInToPractice returnTo={`/practice/reading/${id}`} />;
  }

  return <ReadingPracticeClient readingSet={readingSet} />;
}
