import Link from "next/link";
import { Clock3, FileQuestion, Headphones, Radio } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildLoginRedirectHref } from "@/lib/auth/redirect";
import { isUserSignedIn } from "@/server/services/auth-session";
import { getPublishedListeningSummaries } from "@/server/services/listening-practice";

export const dynamic = "force-dynamic";

export default async function ListeningPracticePage() {
  const [listeningSets, isSignedIn] = await Promise.all([
    getPublishedListeningSummaries(),
    isUserSignedIn(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Listening Practice"
        eyebrowKey="listening.eyebrow"
        title="IELTS Listening practice sets"
        titleKey="listening.title"
        description="Practise IELTS-style Listening with audio, question navigation, automatic scoring, and answer explanations."
        descriptionKey="listening.description"
      />

      <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
        <LocalizedText
          k="practice.betaHint"
          fallback="Free during beta. Sign in to start practice and save your progress."
        />
      </div>

      {listeningSets.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {listeningSets.map((set) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{set.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>Band {set.band}</Badge>
                      <Badge className="bg-white">Section {set.section}</Badge>
                      <Badge className="bg-white">{set.topic}</Badge>
                      <Badge className="bg-slate-50">
                        {set.questionCount}{" "}
                        <LocalizedText
                          k="practice.questions"
                          fallback="questions"
                        />
                      </Badge>
                    </div>
                  </div>
                  <Headphones
                    className="h-5 w-5 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <InfoMetric
                    icon={FileQuestion}
                    labelKey="practice.questionCount"
                    label="Question count"
                    value={`${set.questionCount}`}
                  />
                  <InfoMetric
                    icon={Radio}
                    labelKey="practice.audio"
                    label="Audio"
                    valueKey={
                      set.audioStatus === "ready"
                        ? "practice.readyToPlay"
                        : "practice.availableSoon"
                    }
                    value={formatAudioAvailability(set.audioStatus)}
                  />
                  <InfoMetric
                    icon={Clock3}
                    labelKey="practice.estimatedTime"
                    label="Estimated time"
                    value={`${set.estimatedTimeMinutes} min`}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    <LocalizedText k="practice.added" fallback="Added" />{" "}
                    {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link
                      href={
                        isSignedIn
                          ? `/practice/listening/${set.id}`
                          : buildLoginRedirectHref(
                              `/practice/listening/${set.id}`,
                            )
                      }
                    >
                      <LocalizedText
                        k="practice.startPractice"
                        fallback="Start Practice"
                      />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-[420px] items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <Headphones className="h-6 w-6" aria-hidden="true" />
              </div>
              <Badge className="mt-5 bg-slate-50">
                <LocalizedText
                  k="practice.listening.title"
                  fallback="Listening practice"
                />
              </Badge>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                <LocalizedText
                  k="listening.emptyTitle"
                  fallback="No Listening practice sets yet. Please check back later."
                />
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="listening.emptyDescription"
                  fallback="New Listening practice sets will appear here soon. You can come back later to practise with audio, answer inputs, and automatic scoring."
                />
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/practice">
                  <LocalizedText
                    k="practice.backToPractice"
                    fallback="Back to Practice"
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

function InfoMetric({
  icon: Icon,
  label,
  labelKey,
  value,
  valueKey,
}: {
  icon: typeof FileQuestion;
  label: string;
  labelKey: string;
  value: string;
  valueKey?: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <LocalizedText k={labelKey} fallback={label} />
      </div>
      <p className="mt-1 font-medium text-slate-950">
        {valueKey ? <LocalizedText k={valueKey} fallback={value} /> : value}
      </p>
    </div>
  );
}

function formatAudioAvailability(status: string) {
  return status === "ready" ? "Ready to play" : "Available soon";
}
