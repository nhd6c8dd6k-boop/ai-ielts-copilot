export const normalizeReadingAnswer = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export function isReadingAnswerCorrect(userAnswer: string, correctAnswer: string) {
  const normalizedUserAnswer = normalizeReadingAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeReadingAnswer(correctAnswer);

  return (
    normalizedUserAnswer === normalizedCorrectAnswer ||
    normalizedUserAnswer.startsWith(`${normalizedCorrectAnswer}.`) ||
    normalizedUserAnswer.startsWith(`${normalizedCorrectAnswer} `)
  );
}
