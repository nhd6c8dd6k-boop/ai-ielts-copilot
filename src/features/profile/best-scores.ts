export type BestScoreSkill = "reading" | "listening" | "writing";

export type BestScoreAttempt = {
  id?: string | null;
  skill?: string | null;
  bandEstimate?: unknown;
  overallBand?: unknown;
};

export type BestScores = {
  reading: number | null;
  listening: number | null;
  writing: number | null;
  personalBest: number | null;
};

const validSkills = new Set<BestScoreSkill>([
  "reading",
  "listening",
  "writing",
]);

export function getBestScores(
  attempts?: BestScoreAttempt[] | null,
): BestScores {
  const scores: BestScores = {
    reading: null,
    listening: null,
    writing: null,
    personalBest: null,
  };
  const seen = new Set<string>();

  for (const [index, attempt] of (attempts ?? []).entries()) {
    const skill = normalizeSkill(attempt?.skill);

    if (!skill) {
      continue;
    }

    const dedupeKey = attempt?.id?.trim() || `${skill}-${index}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);

    const band =
      skill === "writing"
        ? attempt.overallBand ?? attempt.bandEstimate
        : attempt.bandEstimate;

    if (!isValidIeltsBand(band)) {
      continue;
    }

    scores[skill] =
      scores[skill] === null ? band : Math.max(scores[skill], band);
  }

  const validBestScores = [
    scores.reading,
    scores.listening,
    scores.writing,
  ].filter((score): score is number => score !== null);

  scores.personalBest =
    validBestScores.length > 0 ? Math.max(...validBestScores) : null;

  return scores;
}

export function isValidIeltsBand(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 9 &&
    Number.isInteger(value * 2)
  );
}

function normalizeSkill(skill?: string | null): BestScoreSkill | null {
  if (!skill) {
    return null;
  }

  const normalized = skill.trim().toLowerCase();

  return validSkills.has(normalized as BestScoreSkill)
    ? (normalized as BestScoreSkill)
    : null;
}
