export const FREE_READING_SET_LIMIT = 5;
export const FREE_LISTENING_SET_LIMIT = 5;
export const FREE_WRITING_DAILY_LIMIT = 1;
export const PRO_WRITING_DAILY_LIMIT = 10;
export const FREE_SPEAKING_DAILY_QUESTION_LIMIT = 5;

export type UsageResource = "reading" | "listening" | "writing" | "speaking";

export type PracticeSetLimitInput = {
  isAdmin: boolean;
  isPro: boolean;
  completedSetIds: Iterable<string>;
  setId: string;
  limit: number;
};

export type WritingDailyLimitInput = {
  isAdmin: boolean;
  isPro: boolean;
  usedToday: number;
};

export type SpeakingDailyLimitInput = {
  isAdmin: boolean;
  isPro: boolean;
  usedToday: number;
  alreadyUnlocked: boolean;
};

export function getUsageDayRange(now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  return {
    startOfDay,
    endOfDay,
    timezone: "UTC" as const,
  };
}

export function getPracticeSetLimitDecision({
  isAdmin,
  isPro,
  completedSetIds,
  setId,
  limit,
}: PracticeSetLimitInput) {
  const completed = new Set(
    Array.from(completedSetIds).filter((value) => Boolean(value)),
  );
  const used = completed.size;
  const isRepeat = completed.has(setId);
  const unlimited = isAdmin || isPro;

  return {
    allowed: unlimited || isRepeat || used < limit,
    unlimited,
    used,
    limit: unlimited ? null : limit,
    isRepeat,
    remainingNewSets: unlimited ? null : Math.max(0, limit - used),
  };
}

export function getWritingDailyLimitDecision({
  isAdmin,
  isPro,
  usedToday,
}: WritingDailyLimitInput) {
  const unlimited = isAdmin;
  const limit = isPro ? PRO_WRITING_DAILY_LIMIT : FREE_WRITING_DAILY_LIMIT;

  return {
    allowed: unlimited || usedToday < limit,
    unlimited,
    usedToday,
    limitToday: unlimited ? null : limit,
    remainingToday: unlimited ? null : Math.max(0, limit - usedToday),
  };
}

export function getSpeakingDailyLimitDecision({
  isAdmin,
  isPro,
  usedToday,
  alreadyUnlocked,
}: SpeakingDailyLimitInput) {
  const unlimited = isAdmin || isPro;
  const limit = FREE_SPEAKING_DAILY_QUESTION_LIMIT;

  return {
    allowed: unlimited || alreadyUnlocked || usedToday < limit,
    unlimited,
    usedToday,
    limitToday: unlimited ? null : limit,
    remainingToday: unlimited ? null : Math.max(0, limit - usedToday),
    alreadyUnlocked,
  };
}
