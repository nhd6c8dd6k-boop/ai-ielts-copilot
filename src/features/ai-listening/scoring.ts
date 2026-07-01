export const normalizeListeningAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[£$,.]/g, "")
    .replace(/\s+/g, " ");

export function isListeningAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
) {
  return normalizeListeningAnswer(userAnswer) === normalizeListeningAnswer(correctAnswer);
}
