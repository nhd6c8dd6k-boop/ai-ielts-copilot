export type WritingQuestionType =
  | "agree_disagree"
  | "discuss_both_views"
  | "advantages_disadvantages"
  | "causes_solutions"
  | "two_part"
  | "positive_negative"
  | "essay_question";

const questionTypeLabels: Record<WritingQuestionType, string> = {
  agree_disagree: "Agree or Disagree",
  discuss_both_views: "Discuss Both Views",
  advantages_disadvantages: "Advantages and Disadvantages",
  causes_solutions: "Causes and Solutions",
  two_part: "Two-part Question",
  positive_negative: "Positive or Negative Development",
  essay_question: "Essay Question",
};

const genericTitlePatterns = [
  /^task\s*[12]\s*:/i,
  /^task\s*[12]$/i,
  /^writing\s+task\s*[12]$/i,
];

const trailingSmallWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

export function getWritingDisplayTitle({
  taskType,
  topic,
  prompt,
  title,
  visualTitle,
}: {
  taskType: 1 | 2;
  topic: string;
  prompt: string;
  title?: string | null;
  visualTitle?: string | null;
}) {
  if (title && !isGenericWritingTitle(title, topic)) {
    return toTitleCase(cleanTitle(title));
  }

  if (taskType === 1) {
    return buildTask1DisplayTitle({ prompt, visualTitle });
  }

  return buildTask2DisplayTitle(prompt);
}

export function isGenericWritingTitle(title: string, topic: string) {
  const normalizedTitle = normalizeComparableText(title);
  const normalizedTopic = normalizeComparableText(topic);

  return (
    !normalizedTitle ||
    normalizedTitle === normalizedTopic ||
    genericTitlePatterns.some((pattern) => pattern.test(title.trim()))
  );
}

export function getWritingQuestionTypeLabel(prompt: string) {
  return questionTypeLabels[inferWritingQuestionType(prompt)];
}

export function inferWritingQuestionType(prompt: string): WritingQuestionType {
  const normalized = prompt.toLowerCase().replace(/\s+/g, " ");

  if (/to what extent do you agree or disagree/.test(normalized)) {
    return "agree_disagree";
  }

  if (/discuss both views/.test(normalized)) {
    return "discuss_both_views";
  }

  if (/advantages and disadvantages/.test(normalized)) {
    return "advantages_disadvantages";
  }

  if (
    /positive or negative development/.test(normalized) ||
    /positive or negative/.test(normalized)
  ) {
    return "positive_negative";
  }

  if (
    (/\bcauses?\b/.test(normalized) && /\bsolutions?\b/.test(normalized)) ||
    /problems?.*solutions?/.test(normalized)
  ) {
    return "causes_solutions";
  }

  const questionCount = prompt.match(/\?/g)?.length ?? 0;

  if (questionCount >= 2) {
    return "two_part";
  }

  return "essay_question";
}

function buildTask1DisplayTitle({
  prompt,
  visualTitle,
}: {
  prompt: string;
  visualTitle?: string | null;
}) {
  if (visualTitle?.trim()) {
    return toTitleCase(cleanTitle(visualTitle));
  }

  const firstSentence = getFirstPromptSentence(prompt);
  const afterShows = firstSentence.match(
    /\b(?:shows?|illustrates?|compares?)\s+(?:the\s+)?(.+?)(?:\.|$)/i,
  )?.[1];
  const source = afterShows || firstSentence;

  return titleFromWords(source, 8, "Writing Task 1");
}

function buildTask2DisplayTitle(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  const contrastMatch = normalized.match(
    /some people (?:believe|think|say|argue) that (.+?),?\s+while others (?:believe|think|say|argue) (?:that\s+)?(.+?)(?:\.| discuss|$)/i,
  );
  if (contrastMatch?.[1] && contrastMatch[2]) {
    return `${titleFromWords(contrastMatch[1], 4, "One View")} vs ${titleFromWords(
      contrastMatch[2],
      4,
      "Another View",
    )}`;
  }

  const somePeopleMatch = normalized.match(
    /some people (?:believe|think|say|argue) that (.+?)(?:\.|, while| while| to what extent| discuss|$)/i,
  );
  if (somePeopleMatch?.[1]) {
    const moreThanMatch = somePeopleMatch[1].match(
      /(?:focus more on|more responsibility for|more important than)\s+(.+?)\s+(?:than|while others|rather than)\s+(.+)$/i,
    );

    if (moreThanMatch?.[1] && moreThanMatch[2]) {
      return `${titleFromWords(moreThanMatch[1], 4, "One Side")} vs ${titleFromWords(
        moreThanMatch[2],
        4,
        "Another Side",
      )}`;
    }

    return titleFromWords(somePeopleMatch[1], 7, "Essay Question");
  }

  const trendMatch = normalized.match(
    /(?:more|many|some)\s+(.+?)(?:\.| what are| discuss| to what extent|$)/i,
  );
  if (trendMatch?.[1]) {
    return titleFromWords(trendMatch[1], 7, "Essay Question");
  }

  return titleFromWords(getFirstPromptSentence(prompt), 8, "Essay Question");
}

function getFirstPromptSentence(prompt: string) {
  return prompt
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.split(/(?<=\.)\s+/)[0]
    .trim() || prompt.trim();
}

function titleFromWords(source: string, maxWords: number, fallback: string) {
  const cleaned = cleanTitle(source)
    .replace(/\b(?:below|above|following|chart|graph|table|diagram)\b/gi, "")
    .replace(/\b(?:shows?|illustrates?|compares?|summarise|information)\b/gi, "")
    .replace(/\b(?:some people|many people|more people|average)\b/gi, "")
    .replace(/\b(?:the|a|an|of|in|on|at|for|to|with|and|or|by)\b$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned
    .split(/\s+/)
    .filter((word) => word && !/^(?:below|above)$/i.test(word))
    .slice(0, maxWords);

  while (
    words.length > 1 &&
    trailingSmallWords.has(words[words.length - 1].toLowerCase())
  ) {
    words.pop();
  }

  return words.length ? toTitleCase(words.join(" ")) : fallback;
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, "")
    .replace(/^[\s:;,.!?-]+|[\s:;,.!?-]+$/g, "")
    .trim();
}

function normalizeComparableText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toTitleCase(value: string) {
  const smallWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "vs",
    "with",
  ]);

  return value
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();

      if (lower === "ai") {
        return "AI";
      }

      if (lower === "ielts") {
        return "IELTS";
      }

      if (lower === "vs" || lower === "versus") {
        return "vs";
      }

      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
