export type LifetimeStatisticsInput = {
  readingCompleted?: unknown;
  listeningCompleted?: unknown;
  writingCompleted?: unknown;
  wordsWritten?: unknown;
};

export type LifetimeStatistics = {
  readingCompleted: number | null;
  listeningCompleted: number | null;
  writingCompleted: number | null;
  wordsWritten: number | null;
};

export function getLifetimeStatistics(
  input?: LifetimeStatisticsInput | null,
): LifetimeStatistics {
  return {
    readingCompleted: normalizeCount(input?.readingCompleted),
    listeningCompleted: normalizeCount(input?.listeningCompleted),
    writingCompleted: normalizeCount(input?.writingCompleted),
    wordsWritten: normalizeWordsWritten(input?.wordsWritten),
  };
}

export function formatLifetimeStatisticValue(
  value: number | null,
  language: "zh" | "en",
) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en").format(
    value,
  );
}

function normalizeCount(value: unknown) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number.isInteger(value)
    ? value
    : null;
}

function normalizeWordsWritten(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}
