import type {
  PracticeHistoryItem,
  PracticeSkill,
} from "@/features/practice-history/storage";

export type DashboardWritingDraft = {
  href: string;
  wordCount: number;
};

export type DashboardNextAction = {
  kind: "continue_draft" | "recommended_skill";
  skill: PracticeSkill;
  eyebrowKey: string;
  eyebrowFallback: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  buttonKey: string;
  buttonFallback: string;
  href: string;
  reasonKey?: string;
  reasonFallback?: string;
  metadata?: {
    wordCount?: number;
  };
};

const skillOrder: PracticeSkill[] = ["writing", "reading", "listening"];

const skillHref: Record<PracticeSkill, string> = {
  reading: "/practice/reading",
  listening: "/practice/listening",
  writing: "/practice/writing",
};

export function getDashboardNextAction({
  history,
  writingDraft,
  isLoading = false,
  isError = false,
}: {
  history: PracticeHistoryItem[];
  writingDraft?: DashboardWritingDraft | null;
  isLoading?: boolean;
  isError?: boolean;
}): DashboardNextAction | null {
  if (isLoading || isError || history.length === 0) {
    return null;
  }

  if (writingDraft) {
    return {
      kind: "continue_draft",
      skill: "writing",
      eyebrowKey: "dashboard.nextAction.continueEyebrow",
      eyebrowFallback: "Continue practice",
      titleKey: "dashboard.nextAction.continueWritingTitle",
      titleFallback: "Continue your Writing draft",
      descriptionKey: "dashboard.nextAction.continueWritingDescription",
      descriptionFallback:
        "You have an unfinished response with {count} words. Pick up where you left off.",
      buttonKey: "dashboard.nextAction.continueWritingButton",
      buttonFallback: "Continue Writing",
      href: writingDraft.href,
      reasonKey: "dashboard.nextAction.reason.continueDraft",
      reasonFallback: "Unfinished draft",
      metadata: {
        wordCount: writingDraft.wordCount,
      },
    };
  }

  const counts = getSkillCounts(history);
  const missingSkill = chooseMissingSkill(counts);

  if (missingSkill) {
    return buildRecommendedSkillAction(
      missingSkill,
      "notPracticed",
      "dashboard.nextAction.reason.notPracticed",
      "Not practised yet",
    );
  }

  const lowerAverageSkill = chooseLowerAverageSkill(history, counts);

  if (lowerAverageSkill) {
    return buildRecommendedSkillAction(
      lowerAverageSkill,
      "weakSkill",
      "dashboard.nextAction.reason.lowerRecentAverage",
      "Lower recent average",
    );
  }

  const leastRecentSkill = chooseLeastRecentlyPracticedSkill(history);

  if (leastRecentSkill) {
    return buildRecommendedSkillAction(
      leastRecentSkill,
      "leastRecent",
      "dashboard.nextAction.reason.leastRecentlyPracticed",
      "Least recently practised",
    );
  }

  return buildGenericAction();
}

function getSkillCounts(history: PracticeHistoryItem[]) {
  return skillOrder.reduce(
    (counts, skill) => ({
      ...counts,
      [skill]: history.filter((item) => item.skill === skill).length,
    }),
    {} as Record<PracticeSkill, number>,
  );
}

function chooseMissingSkill(counts: Record<PracticeSkill, number>) {
  const hasReading = counts.reading > 0;
  const hasListening = counts.listening > 0;
  const hasWriting = counts.writing > 0;

  if (hasReading && !hasListening) {
    return "listening";
  }

  if (hasReading && hasListening && !hasWriting) {
    return "writing";
  }

  if (hasWriting && !hasReading) {
    return "reading";
  }

  for (const skill of skillOrder) {
    if (counts[skill] === 0) {
      return skill;
    }
  }

  return null;
}

function chooseLowerAverageSkill(
  history: PracticeHistoryItem[],
  counts: Record<PracticeSkill, number>,
) {
  if (skillOrder.some((skill) => counts[skill] < 2)) {
    return null;
  }

  const averages = skillOrder
    .map((skill) => ({
      skill,
      average: getAverageBand(history, skill),
    }))
    .filter((item): item is { skill: PracticeSkill; average: number } =>
      Number.isFinite(item.average),
    );

  if (averages.length !== skillOrder.length) {
    return null;
  }

  const sorted = [...averages].sort((a, b) => a.average - b.average);
  const lowest = sorted[0];
  const next = sorted[1];

  return next.average - lowest.average >= 0.25 ? lowest.skill : null;
}

function chooseLeastRecentlyPracticedSkill(history: PracticeHistoryItem[]) {
  const lastPractised = skillOrder
    .map((skill) => ({
      skill,
      timestamp: getLastPractisedTimestamp(history, skill),
    }))
    .filter((item): item is { skill: PracticeSkill; timestamp: number } =>
      Number.isFinite(item.timestamp),
    );

  if (!lastPractised.length) {
    return null;
  }

  return lastPractised.sort((a, b) => a.timestamp - b.timestamp)[0].skill;
}

function buildRecommendedSkillAction(
  skill: PracticeSkill,
  variant: "notPracticed" | "weakSkill" | "leastRecent",
  reasonKey: string,
  reasonFallback: string,
): DashboardNextAction {
  const titleGroup =
    variant === "notPracticed"
      ? "notPracticedTitle"
      : variant === "weakSkill"
        ? "weakSkillTitle"
        : "leastRecentTitle";
  const descriptionGroup =
    variant === "notPracticed"
      ? "notPracticedDescription"
      : variant === "weakSkill"
        ? "weakSkillDescription"
        : "leastRecentDescription";

  return {
    kind: "recommended_skill",
    skill,
    eyebrowKey: "dashboard.nextAction.recommendedEyebrow",
    eyebrowFallback: "Recommended next",
    titleKey: `dashboard.nextAction.${titleGroup}.${skill}`,
    titleFallback: getTitleFallback(skill, variant),
    descriptionKey: `dashboard.nextAction.${descriptionGroup}.${skill}`,
    descriptionFallback: getDescriptionFallback(skill, variant),
    buttonKey: `dashboard.nextAction.button.${skill}`,
    buttonFallback: getButtonFallback(skill),
    href: skillHref[skill],
    reasonKey,
    reasonFallback,
  };
}

function buildGenericAction(): DashboardNextAction {
  return {
    kind: "recommended_skill",
    skill: "writing",
    eyebrowKey: "dashboard.nextAction.recommendedEyebrow",
    eyebrowFallback: "Recommended next",
    titleKey: "dashboard.nextAction.genericTitle",
    titleFallback: "Keep your momentum going",
    descriptionKey: "dashboard.nextAction.genericDescription",
    descriptionFallback:
      "Choose another IELTS practice activity to keep building your score history.",
    buttonKey: "dashboard.nextAction.button.writing",
    buttonFallback: "Start Writing",
    href: skillHref.writing,
    reasonKey: "dashboard.nextAction.reason.buildConsistency",
    reasonFallback: "Continue building consistency",
  };
}

function getAverageBand(history: PracticeHistoryItem[], skill: PracticeSkill) {
  const scores = history
    .filter((item) => item.skill === skill)
    .map((item) => item.bandEstimate)
    .filter((score) => Number.isFinite(score) && score > 0);

  if (!scores.length) {
    return Number.NaN;
  }

  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function getLastPractisedTimestamp(
  history: PracticeHistoryItem[],
  skill: PracticeSkill,
) {
  const timestamps = history
    .filter((item) => item.skill === skill)
    .map((item) => Date.parse(item.createdAt))
    .filter(Number.isFinite);

  return timestamps.length ? Math.max(...timestamps) : Number.NaN;
}

function getTitleFallback(
  skill: PracticeSkill,
  variant: "notPracticed" | "weakSkill" | "leastRecent",
) {
  if (variant === "notPracticed") {
    return `Build your ${capitalizeSkill(skill)} baseline`;
  }

  if (variant === "weakSkill") {
    return `Strengthen your ${capitalizeSkill(skill)} accuracy`;
  }

  return `Return to ${capitalizeSkill(skill)} practice`;
}

function getDescriptionFallback(
  skill: PracticeSkill,
  variant: "notPracticed" | "weakSkill" | "leastRecent",
) {
  if (variant === "notPracticed") {
    return `Complete your first ${capitalizeSkill(skill)} practice to add ${capitalizeSkill(skill)} insights to your dashboard.`;
  }

  if (variant === "weakSkill") {
    return `Your recent ${capitalizeSkill(skill)} results are lower than your other skills. Complete another practice to build consistency.`;
  }

  return `${capitalizeSkill(skill)} is the skill you have practised least recently. Complete another practice to keep your baseline fresh.`;
}

function getButtonFallback(skill: PracticeSkill) {
  return `Start ${capitalizeSkill(skill)}`;
}

function capitalizeSkill(skill: PracticeSkill) {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}
