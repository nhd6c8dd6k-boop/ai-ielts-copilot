import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SpeakingQuestionCard } from "@/components/practice/speaking-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/seo";
import { getPublishedSpeakingTopicBySlug } from "@/server/services/speaking-practice";

type SpeakingDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: SpeakingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getPublishedSpeakingTopicBySlug(slug);

  if (!topic) {
    return {
      title: "IELTS Speaking Practice | AI IELTS Copilot",
    };
  }

  return {
    title: `${topic.title} - IELTS Speaking Practice | AI IELTS Copilot`,
    description: topic.description,
    alternates: {
      canonical: absoluteUrl(`/practice/speaking/${topic.slug}`),
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SpeakingTopicDetailPage({
  params,
}: SpeakingDetailPageProps) {
  const { slug } = await params;
  const topic = await getPublishedSpeakingTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Speaking Part ${topic.part}`}
        eyebrowKey={`speaking.part${topic.part}Eyebrow`}
        title={topic.title}
        description={topic.description}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge>
          <LocalizedText
            k={`speaking.part${topic.part}`}
            fallback={`Part ${topic.part}`}
          />
        </Badge>
        <Badge className="bg-white">
          {topic.questionCount}{" "}
          <LocalizedText k="speaking.questions" fallback="questions" />
        </Badge>
        {topic.targetBand ? (
          <Badge className="bg-slate-50">
            <LocalizedText k="speaking.targetBand" fallback="Target Band" />{" "}
            {topic.targetBand.toFixed(1)}
          </Badge>
        ) : null}
      </div>

      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href={`/practice/speaking/part-${topic.part}`}>
            <LocalizedText
              k="speaking.backToTopics"
              fallback="Back to topics"
            />
          </Link>
        </Button>
      </div>

      {topic.questions.length ? (
        <div className="space-y-5">
          {topic.questions.map((question) => (
            <SpeakingQuestionCard
              key={question.id}
              question={question}
              part={topic.part}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[320px] items-center justify-center">
            <div className="max-w-md text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                <LocalizedText
                  k="speaking.noQuestions"
                  fallback="No questions available yet."
                />
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="speaking.noQuestionsDescription"
                  fallback="This published topic does not have practice questions yet."
                />
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
