"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  CommonMistake,
  SentencePattern,
  SpeakingPart,
  SpeakingQuestion,
  UsefulPhrase,
  VocabularyUpgrade,
} from "@/server/services/speaking-practice";

type BandKey = "band6" | "band7" | "band8";

const bandTabs: Array<{ value: BandKey; key: string; fallback: string }> = [
  { value: "band6", key: "speaking.band6", fallback: "Band 6" },
  { value: "band7", key: "speaking.band7", fallback: "Band 7" },
  { value: "band8", key: "speaking.band8", fallback: "Band 8" },
];

export function SpeakingQuestionCard({
  question,
  part,
}: {
  question: SpeakingQuestion;
  part: SpeakingPart;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-50">
            {t("speaking.question", "Question")} {question.order}
          </Badge>
          <Badge>
            {t(`speaking.part${part}`, `Part ${part}`)}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-8">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {part === 2 ? (
          <CueCard
            points={question.cueCardPoints}
            ideas={question.preparationIdeas}
            structure={question.suggestedStructure}
          />
        ) : null}

        {part === 3 ? (
          <DiscussionFramework question={question} />
        ) : question.answerTip ? (
          <InfoSection title={t("speaking.answerTip", "Answer Tip")}>
            <p>{question.answerTip}</p>
          </InfoSection>
        ) : null}

        <BandSampleSwitcher questionId={question.id} samples={question.samples} />
        <UsefulPhraseList phrases={question.usefulPhrases} />
        <VocabularyUpgradeList vocabulary={question.vocabulary} />
        <SentencePatternList patterns={question.sentencePatterns} />
        <CommonMistakeList mistakes={question.commonMistakes} />
      </CardContent>
    </Card>
  );
}

function BandSampleSwitcher({
  questionId,
  samples,
}: {
  questionId: string;
  samples: SpeakingQuestion["samples"];
}) {
  const { t } = useI18n();
  const [activeBand, setActiveBand] = useState<BandKey>("band7");
  const [isVisible, setIsVisible] = useState(true);
  const idPrefix = `speaking-sample-${questionId}`;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">
          {t("speaking.sampleAnswer", "Sample Answer")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsVisible((current) => !current)}
          aria-expanded={isVisible}
        >
          {isVisible ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              {t("speaking.hideSample", "Hide Sample")}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              {t("speaking.showSample", "Show Sample")}
            </>
          )}
        </Button>
      </div>

      {isVisible ? (
        <div className="mt-4">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label={t("speaking.bandTabs", "Sample answer band")}
          >
            {bandTabs.map((tab) => {
              const active = activeBand === tab.value;
              const tabId = `${idPrefix}-tab-${tab.value}`;
              const panelId = `${idPrefix}-panel-${tab.value}`;

              return (
                <button
                  key={tab.value}
                  id={tabId}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={panelId}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                  )}
                  onClick={() => setActiveBand(tab.value)}
                >
                  {t(tab.key, tab.fallback)}
                </button>
              );
            })}
          </div>
          {bandTabs.map((tab) => {
            const active = activeBand === tab.value;

            return (
              <div
                key={tab.value}
                id={`${idPrefix}-panel-${tab.value}`}
                role="tabpanel"
                aria-labelledby={`${idPrefix}-tab-${tab.value}`}
                hidden={!active}
                className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-7 text-slate-700"
              >
                {samples[tab.value]}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function CueCard({
  points,
  ideas,
  structure,
}: {
  points: string[];
  ideas: string[];
  structure: string[];
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <InfoSection title={t("speaking.youShouldSay", "You should say")}>
        <BulletList items={points} />
      </InfoSection>
      <InfoSection title={t("speaking.preparationIdeas", "Preparation Ideas")}>
        <BulletList items={ideas} />
      </InfoSection>
      <InfoSection title={t("speaking.suggestedStructure", "Suggested Structure")}>
        <ol className="space-y-2">
          {structure.map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="font-semibold text-slate-950">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </InfoSection>
    </div>
  );
}

function DiscussionFramework({ question }: { question: SpeakingQuestion }) {
  const { t } = useI18n();
  const items = [
    {
      label: t("speaking.directAnswer", "Direct answer"),
      value: question.directAnswer,
    },
    {
      label: t("speaking.mainReason", "Main reason"),
      value: question.mainReason,
    },
    { label: t("speaking.example", "Example"), value: question.example },
    {
      label: t("speaking.alternativePerspective", "Alternative perspective"),
      value: question.alternativePerspective,
    },
  ].filter((item) => item.value);

  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <InfoSection key={item.label} title={item.label}>
          <p>{item.value}</p>
        </InfoSection>
      ))}
    </div>
  );
}

function UsefulPhraseList({ phrases }: { phrases: UsefulPhrase[] }) {
  const { t } = useI18n();

  if (!phrases.length) {
    return null;
  }

  return (
    <InfoSection title={t("speaking.usefulPhrases", "Useful Phrases")}>
      <div className="grid gap-3 md:grid-cols-2">
        {phrases.map((phrase) => (
          <div key={phrase.phrase} className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold text-slate-950">{phrase.phrase}</p>
            <p className="mt-1 text-slate-600">{phrase.meaning}</p>
            <p className="mt-2 text-slate-500">{phrase.example}</p>
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

function VocabularyUpgradeList({
  vocabulary,
}: {
  vocabulary: VocabularyUpgrade[];
}) {
  const { t } = useI18n();

  if (!vocabulary.length) {
    return null;
  }

  return (
    <InfoSection title={t("speaking.vocabularyUpgrades", "Vocabulary Upgrades")}>
      <div className="space-y-3">
        {vocabulary.map((item) => (
          <div key={item.insteadOf} className="rounded-md border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t("speaking.insteadOf", "Instead of")}
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {item.insteadOf}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {t("speaking.try", "Try")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.try.map((word) => (
                    <Badge key={word} className="bg-slate-50">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-slate-600">{item.meaning}</p>
            <p className="mt-2 text-slate-500">{item.example}</p>
            <p className="mt-2 text-xs text-slate-500">{item.context}</p>
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

function SentencePatternList({ patterns }: { patterns: SentencePattern[] }) {
  const { t } = useI18n();

  if (!patterns.length) {
    return null;
  }

  return (
    <InfoSection title={t("speaking.sentencePatterns", "Sentence Patterns")}>
      <div className="grid gap-3 md:grid-cols-2">
        {patterns.map((pattern) => (
          <div key={pattern.pattern} className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold text-slate-950">{pattern.pattern}</p>
            <p className="mt-2 text-slate-600">{pattern.example}</p>
            <p className="mt-2 text-xs text-slate-500">{pattern.suitableUse}</p>
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

function CommonMistakeList({ mistakes }: { mistakes: CommonMistake[] }) {
  const { t } = useI18n();

  if (!mistakes.length) {
    return null;
  }

  return (
    <InfoSection title={t("speaking.commonMistakes", "Common Mistakes")}>
      <div className="space-y-3">
        {mistakes.map((mistake) => (
          <div
            key={`${mistake.incorrect}-${mistake.better}`}
            className="rounded-md border border-slate-200 p-3"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <LabeledText label={t("speaking.incorrect", "Incorrect")} value={mistake.incorrect} />
              <LabeledText label={t("speaking.better", "Better")} value={mistake.better} />
              <LabeledText label={t("speaking.why", "Why")} value={mistake.why} />
            </div>
          </div>
        ))}
      </div>
    </InfoSection>
  );
}

function LabeledText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
      <h3 className="mb-3 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
