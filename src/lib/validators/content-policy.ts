const blockedTerms = [
  "cambridge ielts",
  "official answer",
  "exam recall",
  "real test question",
  "past paper",
];

export function assertOriginalContentPolicy(text: string) {
  const normalized = text.toLowerCase();
  const blockedTerm = blockedTerms.find((term) => normalized.includes(term));

  if (blockedTerm) {
    throw new Error(`Generated content failed policy check: ${blockedTerm}`);
  }
}
