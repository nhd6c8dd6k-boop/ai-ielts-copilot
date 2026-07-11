const CRITERION_BAND_PATTERNS = [
  /\b(?:TR|TA|CC|LR|GRA)\s*(?:[:=]|[-–])?\s*(?:Band\s*)?[0-9](?:\.[05])?\b/gi,
  /\b(?:Task Response|Task Achievement|Coherence and Cohesion|Lexical Resource|Grammatical Range and Accuracy)\s*(?:[:=]|[-–])?\s*(?:Band\s*)?[0-9](?:\.[05])?\b/gi,
  /\b(?:Task Response|Task Achievement|Coherence and Cohesion|Lexical Resource|Grammatical Range and Accuracy)\s*(?:is|was|at)\s*(?:Band\s*)?[0-9](?:\.[05])?\b/gi,
  /\b(?:Band\s*)?[0-9](?:\.[05])?\s*(?:for|in)\s*(?:Task Response|Task Achievement|Coherence and Cohesion|Lexical Resource|Grammatical Range and Accuracy)\b/gi,
  /\bBand\s*[0-9](?:\.[05])?\b/gi,
];

export function sanitizeScoreSummaryBands(scoreSummary: string[]) {
  const sanitized = scoreSummary
    .map((item) => sanitizeScoreSummaryItem(item))
    .filter(Boolean);

  return sanitized.length ? sanitized.slice(0, 5) : scoreSummary.slice(0, 5);
}

function sanitizeScoreSummaryItem(item: string) {
  let sanitized = item;

  for (const pattern of CRITERION_BAND_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  return cleanupSummaryPunctuation(sanitized);
}

function cleanupSummaryPunctuation(value: string) {
  return value
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s*\/\s*\/\s*/g, " ")
    .replace(/^[\s/:;,.=\-–]+/, "")
    .replace(/[\s/:;,.=\-–]+$/, "")
    .replace(/\s+\/\s+(?=[:;,.=\-–]|\s|$)/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
