import type {
  PracticeHistoryItem,
  PracticeSkill,
} from "@/features/practice-history/storage";

export type SkillFocusStatus =
  | "not_practised"
  | "needs_practice"
  | "building_consistency"
  | "good_progress"
  | "strong_performance";

export type SkillFocusInsight = {
  skill: PracticeSkill;
  titleKey: string;
  titleFallback: string;
  status: SkillFocusStatus;
  statusKey: string;
  statusFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  buttonKey: string;
  buttonFallback: string;
  href: string;
};

const skills: PracticeSkill[] = ["reading", "listening", "writing"];

const skillHref: Record<PracticeSkill, string> = {
  reading: "/practice/reading",
  listening: "/practice/listening",
  writing: "/practice/writing",
};

const titleFallbacks: Record<PracticeSkill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
};

export function getSkillFocusInsights(
  history: PracticeHistoryItem[] | null | undefined,
): SkillFocusInsight[] {
  return skills.map((skill) => buildSkillFocusInsight(skill, history ?? []));
}

function buildSkillFocusInsight(
  skill: PracticeSkill,
  history: PracticeHistoryItem[],
): SkillFocusInsight {
  const attempts = history.filter((item) => item.skill === skill);
  const status = getSkillFocusStatus(skill, attempts);

  return {
    skill,
    titleKey: `dashboard.skillFocus.${skill}.title`,
    titleFallback: titleFallbacks[skill],
    status,
    statusKey: `dashboard.skillFocus.status.${status}`,
    statusFallback: getStatusFallback(status),
    descriptionKey: `dashboard.skillFocus.${skill}.description.${status}`,
    descriptionFallback: getDescriptionFallback(skill, status),
    buttonKey: `dashboard.skillFocus.${skill}.button`,
    buttonFallback: `Practice ${titleFallbacks[skill]}`,
    href: skillHref[skill],
  };
}

function getSkillFocusStatus(
  skill: PracticeSkill,
  attempts: PracticeHistoryItem[],
): SkillFocusStatus {
  if (!attempts.length) {
    return "not_practised";
  }

  const average = getReliableAverage(attempts);

  if (average === null) {
    return "building_consistency";
  }

  if (skill === "writing") {
    if (average < 6) {
      return "needs_practice";
    }

    if (average < 7) {
      return "building_consistency";
    }

    return "strong_performance";
  }

  if (average < 6) {
    return "needs_practice";
  }

  if (average < 6.5) {
    return "building_consistency";
  }

  if (average < 7.5) {
    return "good_progress";
  }

  return "strong_performance";
}

function getReliableAverage(attempts: PracticeHistoryItem[]) {
  const bands = attempts
    .map((item) => item.bandEstimate)
    .filter((score) => Number.isFinite(score) && score > 0);

  if (bands.length) {
    return bands.reduce((total, score) => total + score, 0) / bands.length;
  }

  const accuracies = attempts
    .map((item) => item.accuracy)
    .filter((score): score is number => Number.isFinite(score));

  if (!accuracies.length) {
    return null;
  }

  const averageAccuracy =
    accuracies.reduce((total, score) => total + score, 0) / accuracies.length;

  return accuracyToBandEstimate(averageAccuracy);
}

function accuracyToBandEstimate(accuracy: number) {
  if (accuracy >= 85) {
    return 7.5;
  }

  if (accuracy >= 72) {
    return 7;
  }

  if (accuracy >= 60) {
    return 6.5;
  }

  if (accuracy >= 50) {
    return 6;
  }

  return 5.5;
}

function getStatusFallback(status: SkillFocusStatus) {
  if (status === "not_practised") {
    return "Not practised yet";
  }

  if (status === "needs_practice") {
    return "Needs more practice";
  }

  if (status === "good_progress") {
    return "Good progress";
  }

  if (status === "strong_performance") {
    return "Strong performance";
  }

  return "Building consistency";
}

function getDescriptionFallback(
  skill: PracticeSkill,
  status: SkillFocusStatus,
) {
  const fallback: Record<PracticeSkill, Record<SkillFocusStatus, string>> = {
    reading: {
      not_practised: "Complete your first Reading set to unlock Reading insights.",
      needs_practice:
        "Recent results suggest practising longer passages and reviewing answer explanations.",
      building_consistency:
        "Keep practising to improve consistency across different Reading question types.",
      good_progress: "You are building a solid Reading foundation.",
      strong_performance:
        "Maintain your Reading performance with regular timed practice.",
    },
    listening: {
      not_practised:
        "Complete your first Listening set to unlock Listening insights.",
      needs_practice:
        "Recent results suggest practising with audio and reviewing missed details.",
      building_consistency:
        "Keep practising to improve consistency with spelling, numbers, and short answers.",
      good_progress: "You are building a solid Listening foundation.",
      strong_performance:
        "Maintain your Listening performance with regular audio practice.",
    },
    writing: {
      not_practised:
        "Complete your first Writing task to receive AI feedback.",
      needs_practice:
        "Focus on developing ideas and supporting examples in your next response.",
      building_consistency:
        "Keep strengthening organisation and clarity in your writing.",
      good_progress:
        "Keep refining paragraph development and language control.",
      strong_performance:
        "Maintain your writing quality with regular practice.",
    },
  };

  return fallback[skill][status];
}
