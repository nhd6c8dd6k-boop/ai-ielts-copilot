import type {
  PracticeHistoryItem,
  PracticeSkill,
} from "@/features/practice-history/storage";

export type WeeklyProgressGoalKey = PracticeSkill | "total";

export type WeeklyProgressGoals = Record<WeeklyProgressGoalKey, number>;

export type WeeklyPracticeAttempt = {
  id?: string | null;
  skill?: string | null;
  completedAt?: string | null;
};

export type WeeklyProgressItem = {
  completed: number;
  goal: number;
  percent: number;
};

export type WeeklyPracticeProgress = Record<
  WeeklyProgressGoalKey,
  WeeklyProgressItem
> & {
  isGoalComplete: boolean;
  weekStart: Date;
  weekEnd: Date;
};

export const WEEKLY_GOALS: WeeklyProgressGoals = {
  reading: 2,
  listening: 2,
  writing: 1,
  total: 5,
};

const skills: PracticeSkill[] = ["reading", "listening", "writing"];

export function getLocalWeekRange(now = new Date()) {
  const weekStart = new Date(now);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return { weekStart, weekEnd };
}

export function mapPracticeHistoryToWeeklyAttempts(
  history: PracticeHistoryItem[],
): WeeklyPracticeAttempt[] {
  return history.map((item) => ({
    id: item.id,
    skill: item.skill,
    completedAt: item.createdAt,
  }));
}

export function getWeeklyPracticeProgress({
  attempts,
  now = new Date(),
  weekStart,
  weekEnd,
  goals = WEEKLY_GOALS,
}: {
  attempts?: WeeklyPracticeAttempt[] | null;
  now?: Date;
  weekStart?: Date;
  weekEnd?: Date;
  goals?: WeeklyProgressGoals;
}): WeeklyPracticeProgress {
  const range =
    weekStart && weekEnd ? { weekStart, weekEnd } : getLocalWeekRange(now);
  const counts: Record<PracticeSkill, number> = {
    reading: 0,
    listening: 0,
    writing: 0,
  };
  const countedIds = new Set<string>();

  for (const [index, attempt] of (attempts ?? []).entries()) {
    const skill = normalizeSkill(attempt?.skill);

    if (!skill) {
      continue;
    }

    const timestamp = parseCompletedAt(attempt?.completedAt);

    if (
      timestamp === null ||
      timestamp < range.weekStart.getTime() ||
      timestamp >= range.weekEnd.getTime() ||
      timestamp > now.getTime()
    ) {
      continue;
    }

    const dedupeKey = attempt?.id?.trim() || `${skill}-${timestamp}-${index}`;

    if (countedIds.has(dedupeKey)) {
      continue;
    }

    countedIds.add(dedupeKey);
    counts[skill] += 1;
  }

  const totalCompleted = skills.reduce(
    (total, skill) => total + counts[skill],
    0,
  );

  return {
    reading: buildProgressItem(counts.reading, goals.reading),
    listening: buildProgressItem(counts.listening, goals.listening),
    writing: buildProgressItem(counts.writing, goals.writing),
    total: buildProgressItem(totalCompleted, goals.total),
    isGoalComplete: totalCompleted >= goals.total,
    weekStart: range.weekStart,
    weekEnd: range.weekEnd,
  };
}

function normalizeSkill(skill?: string | null): PracticeSkill | null {
  if (skill === "reading" || skill === "listening" || skill === "writing") {
    return skill;
  }

  return null;
}

function parseCompletedAt(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildProgressItem(
  completed: number,
  goal: number,
): WeeklyProgressItem {
  const safeGoal = Math.max(goal, 1);

  return {
    completed,
    goal,
    percent: Math.min(100, Math.round((completed / safeGoal) * 100)),
  };
}
