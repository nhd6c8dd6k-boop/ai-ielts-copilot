export type SpeakingPart = 1 | 2 | 3;

export type UsefulPhrase = {
  phrase: string;
  meaning: string;
  example: string;
};

export type VocabularyUpgrade = {
  insteadOf: string;
  try: string[];
  meaning: string;
  example: string;
  context: string;
};

export type SentencePattern = {
  pattern: string;
  example: string;
  suitableUse: string;
};

export type CommonMistake = {
  incorrect: string;
  better: string;
  why: string;
};

export function parseSpeakingPart(part: number): SpeakingPart {
  return part === 2 || part === 3 ? part : 1;
}

export function parseOptionalNumber(value: number | string | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function readUsefulPhrases(value: unknown) {
  return readObjectArray(value, isUsefulPhrase);
}

export function readVocabularyUpgrades(value: unknown) {
  return readObjectArray(value, isVocabularyUpgrade);
}

export function readSentencePatterns(value: unknown) {
  return readObjectArray(value, isSentencePattern);
}

export function readCommonMistakes(value: unknown) {
  return readObjectArray(value, isCommonMistake);
}

function readObjectArray<T>(
  value: unknown,
  predicate: (value: unknown) => value is T,
) {
  return Array.isArray(value) ? value.filter(predicate) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUsefulPhrase(value: unknown): value is UsefulPhrase {
  return (
    isRecord(value) &&
    typeof value.phrase === "string" &&
    typeof value.meaning === "string" &&
    typeof value.example === "string"
  );
}

function isVocabularyUpgrade(value: unknown): value is VocabularyUpgrade {
  return (
    isRecord(value) &&
    typeof value.insteadOf === "string" &&
    Array.isArray(value.try) &&
    value.try.every((item) => typeof item === "string") &&
    typeof value.meaning === "string" &&
    typeof value.example === "string" &&
    typeof value.context === "string"
  );
}

function isSentencePattern(value: unknown): value is SentencePattern {
  return (
    isRecord(value) &&
    typeof value.pattern === "string" &&
    typeof value.example === "string" &&
    typeof value.suitableUse === "string"
  );
}

function isCommonMistake(value: unknown): value is CommonMistake {
  return (
    isRecord(value) &&
    typeof value.incorrect === "string" &&
    typeof value.better === "string" &&
    typeof value.why === "string"
  );
}
