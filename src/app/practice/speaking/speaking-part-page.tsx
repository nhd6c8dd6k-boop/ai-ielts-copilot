import Link from "next/link";
import { MessageSquareText } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPublishedSpeakingTopicsByPart,
  type SpeakingPart,
  type SpeakingTopicSummary,
} from "@/server/services/speaking-practice";

const partCopy = {
  1: {
    eyebrow: "Speaking Part 1",
    eyebrowKey: "speaking.part1Eyebrow",
    title: "IELTS Speaking Part 1 Topics",
    titleKey: "speaking.part1Title",
    description:
      "Practise short answers for familiar topics such as home, work, study, and daily life.",
    descriptionKey: "speaking.part1PageDescription",
  },
  2: {
    eyebrow: "Speaking Part 2",
    eyebrowKey: "speaking.part2Eyebrow",
    title: "IELTS Speaking Part 2 Cue Cards",
    titleKey: "speaking.part2Title",
    description:
      "Build longer cue card answers with preparation ideas, structure, and sample responses.",
    descriptionKey: "speaking.part2PageDescription",
  },
  3: {
    eyebrow: "Speaking Part 3",
    eyebrowKey: "speaking.part3Eyebrow",
    title: "IELTS Speaking Part 3 Discussion Topics",
    titleKey: "speaking.part3Title",
    description:
      "Develop opinions for abstract discussion questions with reasons, examples, and balanced views.",
    descriptionKey: "speaking.part3PageDescription",
  },
} satisfies Record<SpeakingPart, {
  eyebrow: string;
  eyebrowKey: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
}>;

export async function SpeakingPartPage({ part }: { part: SpeakingPart }) {
  const topics = await getPublishedSpeakingTopicsByPart(part);
  const copy = partCopy[part];

  return (
    <AppShell>
      <PageHeader
        eyebrow={copy.eyebrow}
        eyebrowKey={copy.eyebrowKey}
        title={copy.title}
        titleKey={copy.titleKey}
        description={copy.description}
        descriptionKey={copy.descriptionKey}
      />

      {topics.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {topics.map((topic) => (
            <SpeakingTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[360px] items-center justify-center">
            <div className="max-w-md text-center">
              <MessageSquareText
                className="mx-auto h-10 w-10 text-slate-400"
                aria-hidden="true"
              />
              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                <LocalizedText
                  k="speaking.noTopics"
                  fallback="No topics available yet."
                />
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="speaking.noTopicsDescription"
                  fallback="Published Speaking preparation topics will appear here."
                />
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/practice/speaking">
                  <LocalizedText
                    k="speaking.backToSpeaking"
                    fallback="Back to Speaking"
                  />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function SpeakingTopicCard({ topic }: { topic: SpeakingTopicSummary }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{topic.title}</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>
                <LocalizedText
                  k={`speaking.part${topic.part}`}
                  fallback={`Part ${topic.part}`}
                />
              </Badge>
              <Badge className="bg-white">
                {topic.questionCount}{" "}
                <LocalizedText
                  k="speaking.questions"
                  fallback="questions"
                />
              </Badge>
              {topic.targetBand ? (
                <Badge className="bg-slate-50">
                  <LocalizedText
                    k="speaking.targetBand"
                    fallback="Target Band"
                  />{" "}
                  {topic.targetBand.toFixed(1)}
                </Badge>
              ) : null}
            </div>
          </div>
          <MessageSquareText
            className="h-5 w-5 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{topic.description}</p>
        <Button asChild className="mt-5 w-full sm:w-auto">
          <Link href={`/practice/speaking/${topic.slug}`}>
            <LocalizedText
              k="speaking.viewPractice"
              fallback="View Practice"
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
