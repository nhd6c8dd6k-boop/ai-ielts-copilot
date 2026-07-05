export type ListeningAnswerPartCountInput = {
  prompt: string;
  metadata?: unknown;
  correctAnswer?: string | null;
};

export function getListeningAnswerPartCount({
  prompt,
  metadata,
  correctAnswer,
}: ListeningAnswerPartCountInput) {
  const metadataCount = getMetadataAnswerCount(metadata);

  if (metadataCount > 1) {
    return metadataCount;
  }

  const blankCount = countBlankMarkers(prompt);

  if (blankCount > 1) {
    return blankCount;
  }

  const answerCount = getAnswerParts(correctAnswer ?? "").length;

  return Math.max(1, answerCount);
}

export function joinAnswerParts(parts: string[]) {
  return parts.map((part) => part.trim()).join("; ");
}

export function getAnswerParts(value: string) {
  return value
    .split(/\s*;\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getDisplayAnswerParts(value: string) {
  const parts = getAnswerParts(value);

  return parts.length > 1 ? parts : [value.trim()].filter(Boolean);
}

export function isListeningAnswerCorrect({
  userAnswer,
  correctAnswer,
}: {
  userAnswer: string;
  correctAnswer: string;
}) {
  const correctCombos = getAcceptedAnswerCombos(correctAnswer);
  const userParts = getAnswerParts(userAnswer);

  if (!userParts.length) {
    return false;
  }

  const multiPartCombos = correctCombos.filter((combo) => combo.length > 1);

  if (!multiPartCombos.length) {
    return correctCombos.some((combo) =>
      combo.some((acceptedParts) =>
        acceptedParts.some((acceptedAnswer) =>
          isSingleAnswerMatch(userAnswer, acceptedAnswer),
        ),
      ),
    );
  }

  return multiPartCombos.some((combo) => {
    if (combo.length !== userParts.length) {
      return false;
    }

    return combo.every((acceptedAnswersForPart, index) =>
      acceptedAnswersForPart.some((acceptedAnswer) =>
        isSingleAnswerMatch(userParts[index] ?? "", acceptedAnswer),
      ),
    );
  });
}

function getAcceptedAnswerCombos(correctAnswer: string) {
  return correctAnswer
    .split(/\s*(?:\|\||\|)\s*/)
    .map((combo) =>
      getAnswerParts(combo).map((part) =>
        part
          .split(/\s+\/\s+/)
          .map((answer) => answer.trim())
          .filter(Boolean),
      ),
    )
    .filter((combo) => combo.length && combo.every((part) => part.length));
}

function isSingleAnswerMatch(userAnswer: string, acceptedAnswer: string) {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedAcceptedAnswer = normalizeAnswer(acceptedAnswer);

  if (!normalizedUserAnswer || !normalizedAcceptedAnswer) {
    return false;
  }

  return (
    normalizedUserAnswer === normalizedAcceptedAnswer ||
    normalizedUserAnswer.startsWith(`${normalizedAcceptedAnswer}.`) ||
    normalizedUserAnswer.startsWith(`${normalizedAcceptedAnswer} `) ||
    normalizedAcceptedAnswer.startsWith(`${normalizedUserAnswer}.`) ||
    normalizedAcceptedAnswer.startsWith(`${normalizedUserAnswer} `)
  );
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getMetadataAnswerCount(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return 0;
  }

  const value = metadata as Record<string, unknown>;
  const answerCount = value.answer_count ?? value.answerCount;
  const blanks = value.blanks;
  const parts = value.parts;

  if (typeof answerCount === "number" && Number.isFinite(answerCount)) {
    return Math.max(0, Math.floor(answerCount));
  }

  if (Array.isArray(blanks)) {
    return blanks.length;
  }

  if (typeof blanks === "number" && Number.isFinite(blanks)) {
    return Math.max(0, Math.floor(blanks));
  }

  if (Array.isArray(parts)) {
    return parts.length;
  }

  return 0;
}

function countBlankMarkers(prompt: string) {
  const underscoreBlanks = prompt.match(/_{2,}/g)?.length ?? 0;
  const bracketBlanks = prompt.match(/\[(?:blank|answer)\]/gi)?.length ?? 0;

  return underscoreBlanks + bracketBlanks;
}
