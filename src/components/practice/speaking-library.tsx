"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2, LockKeyhole } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactToUpgradeButton } from "@/features/payments/contact-to-upgrade-button";
import {
  buildLoginRedirectHref,
  buildRegisterRedirectHref,
} from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";
import type {
  CommonMistake,
  SentencePattern,
  SpeakingPart,
  SpeakingQuestion,
  SpeakingQuestionSummary,
  SpeakingUsageSummary,
  UsefulPhrase,
  VocabularyUpgrade,
} from "@/server/services/speaking-practice";

type BandKey = "band6" | "band7" | "band8";

const bandTabs: Array<{ value: BandKey; key: string; fallback: string }> = [
  { value: "band6", key: "speaking.band6", fallback: "Band 6" },
  { value: "band7", key: "speaking.band7", fallback: "Band 7" },
  { value: "band8", key: "speaking.band8", fallback: "Band 8" },
];

export function SpeakingTopicPractice({
  questions,
  part,
  initialUsage,
}: {
  questions: SpeakingQuestionSummary[];
  part: SpeakingPart;
  initialUsage: SpeakingUsageSummary;
}) {
  const { t } = useI18n();
  const [usage, setUsage] = useState(initialUsage);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {usage.isUnlimited
                ? t("speaking.unlimitedPractice", "Unlimited Speaking practice")
                : t(
                    "speaking.freeLimitTitle",
                    "5 free questions per day",
                  )}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {usage.isUnlimited
                ? t(
                    "speaking.unlimitedPracticeDescription",
                    "Your Pro or Admin access is not limited by the daily free allowance.",
                  )
                : t("speaking.usageSummary", "{used} of {limit} used today")
                    .replace("{used}", String(usage.usedToday))
                    .replace("{limit}", String(usage.limitToday ?? 5))}
            </p>
          </div>
          {!usage.isUnlimited ? (
            <Badge className="w-fit bg-slate-50">
              {t("speaking.remainingToday", "{count} remaining today").replace(
                "{count}",
                String(usage.remainingToday ?? 0),
              )}
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      {questions.map((question) => (
        <SpeakingQuestionAccessCard
          key={question.id}
          question={question}
          part={part}
          usage={usage}
          onUsageChange={setUsage}
        />
      ))}
    </div>
  );
}

function SpeakingQuestionAccessCard({
  question,
  part,
  usage,
  onUsageChange,
}: {
  question: SpeakingQuestionSummary;
  part: SpeakingPart;
  usage: SpeakingUsageSummary;
  onUsageChange: (usage: SpeakingUsageSummary) => void;
}) {
  const { t } = useI18n();
  const [fullQuestion, setFullQuestion] = useState<SpeakingQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<"login" | "limit" | "generic" | null>(null);
  const isUnlocked = usage.unlockedQuestionIds.includes(question.id);
  const canTryUnlock =
    usage.isUnlimited || isUnlocked || (usage.remainingToday ?? 0) > 0;

  const loadQuestion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/practice/speaking/questions/${question.id}`, {
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as {
        question?: SpeakingQuestion;
        usage?: SpeakingUsageSummary;
        error?: string;
      };

      if (response.status === 401) {
        setError("login");
        return;
      }

      if (response.status === 402) {
        setError("limit");
        if (payload.usage) {
          onUsageChange(payload.usage);
        }
        return;
      }

      if (!response.ok || !payload.question) {
        setError("generic");
        return;
      }

      setFullQuestion(payload.question);
      if (payload.usage) {
        onUsageChange(payload.usage);
      }
    } catch {
      setError("generic");
    } finally {
      setIsLoading(false);
    }
  };

  if (fullQuestion) {
    return <SpeakingQuestionCard question={fullQuestion} part={part} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-50">
            {t("speaking.question", "Question")} {question.order}
          </Badge>
          <Badge>{t(`speaking.part${part}`, `Part ${part}`)}</Badge>
          {isUnlocked ? (
            <Badge className="border-teal-200 bg-teal-50 text-teal-800">
              {t("speaking.unlockedToday", "Unlocked today")}
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-xl leading-8">
          {t("speaking.lockedQuestionTitle", "Speaking question")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error === "login" ? (
          <SignInSpeakingPrompt />
        ) : error === "limit" || !canTryUnlock ? (
          <SpeakingLimitReached />
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <LockKeyhole
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-slate-950">
                  {t(
                    "speaking.unlockPromptTitle",
                    "Unlock this Speaking question",
                  )}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {usage.isSignedIn
                    ? t(
                        "speaking.unlockPromptDescription",
                        "Opening a new question uses one of your 5 free Speaking questions for today.",
                      )
                    : t(
                        "speaking.signInDescription",
                        "Create a free account to unlock up to 5 Speaking questions per day.",
                      )}
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  onClick={loadQuestion}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {isUnlocked
                    ? t("speaking.viewUnlockedQuestion", "View question")
                    : t("speaking.unlockQuestion", "Unlock question")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {error === "generic" ? (
          <p className="mt-4 text-sm text-red-700">
            {t(
              "speaking.loadQuestionError",
              "Unable to load this question. Please try again.",
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

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

function SignInSpeakingPrompt() {
  const { t } = useI18n();
  const returnTo =
    typeof window === "undefined"
      ? "/practice/speaking"
      : `${window.location.pathname}${window.location.search}`;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-950">
        {t("speaking.signInTitle", "Sign in to practise Speaking questions.")}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t(
          "speaking.signInDescription",
          "Create a free account to unlock up to 5 Speaking questions per day.",
        )}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={buildLoginRedirectHref(returnTo)}>
            {t("auth.signIn", "Sign in")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={buildRegisterRedirectHref(returnTo)}>
            {t("auth.createAccount", "Create account")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SpeakingLimitReached() {
  const { t } = useI18n();

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-950">
        {t(
          "speaking.limitReachedTitle",
          "You’ve reached today’s free Speaking limit.",
        )}
      </p>
      <p className="mt-2 text-sm leading-6 text-amber-900">
        {t(
          "speaking.limitReachedDescription",
          "Free members can unlock up to 5 Speaking questions per day. Upgrade to Pro for unlimited Speaking practice.",
        )}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/pricing">
            {t("speaking.upgradeToPro", "Upgrade to Pro")}
          </Link>
        </Button>
        <ContactToUpgradeButton plan="monthly" variant="outline" />
      </div>
    </div>
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
