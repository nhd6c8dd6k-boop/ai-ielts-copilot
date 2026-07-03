import {
  stripSpeakerLabels,
  type ListeningScriptSegment,
} from "@/server/services/listening-script-parser";

export type NormalizedSpeechSegment = ListeningScriptSegment & {
  speechText: string;
  pauseMs: number;
};

const PHONE_NUMBER_PATTERN = /\b(\d{3})(\d{3})(\d{4})\b/g;
const POSTAL_CODE_PATTERN = /\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/g;
const MONEY_PATTERN = /\$(\d+(?:\.\d{1,2})?)\b/g;

export function normalizeSpeechText(text: string) {
  return ensureSentenceEnding(
    normalizeMoney(
      normalizePostalCodes(normalizePhoneNumbers(stripSpeakerLabels(text))),
    ),
  );
}

export function buildNaturalSpeechSegmentText({
  text,
  pauseMs,
}: {
  text: string;
  pauseMs: number;
}) {
  const normalized = normalizeSpeechText(text);
  const pauseMarker = getPauseMarker(pauseMs);

  return pauseMarker ? `${normalized} ${pauseMarker}` : normalized;
}

export function getPauseDuration(
  segment: ListeningScriptSegment,
  nextSegment?: ListeningScriptSegment,
) {
  if (!nextSegment) {
    return 0;
  }

  const currentText = segment.text.trim();
  const nextText = nextSegment.text.trim();
  const jitter = getStableJitter(currentText + nextText);

  if (isNewTopicStart(nextText)) {
    return 700 + (jitter % 201);
  }

  if (isInformationListing(currentText) || isInformationListing(nextText)) {
    return 500 + (jitter % 201);
  }

  if (isQuestion(currentText)) {
    return 550 + (jitter % 201);
  }

  if (segment.speaker !== nextSegment.speaker) {
    return 350 + (jitter % 151);
  }

  return 300 + (jitter % 151);
}

function normalizePhoneNumbers(text: string) {
  return text.replace(
    PHONE_NUMBER_PATTERN,
    (_match, area: string, prefix: string, line: string) =>
      `${area}, ${prefix}, ${line}`,
  );
}

function normalizePostalCodes(text: string) {
  return text.replace(
    POSTAL_CODE_PATTERN,
    (_match, first: string, second: string) =>
      `${first.split("").join(" ")}, ${second.split("").join(" ")}`,
  );
}

function normalizeMoney(text: string) {
  return text.replace(MONEY_PATTERN, (_match, amount: string) => {
    const numericAmount = Number(amount);

    if (Number.isInteger(numericAmount)) {
      return `${numericAmount} dollars`;
    }

    return `${amount} dollars`;
  });
}

function ensureSentenceEnding(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/[.!?…]$/.test(trimmed) || /[A-Z](?:-[A-Z])+$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function getPauseMarker(pauseMs: number) {
  if (pauseMs >= 900) {
    return "... ... ...";
  }

  if (pauseMs >= 700) {
    return "... ...";
  }

  if (pauseMs >= 500) {
    return "...";
  }

  if (pauseMs >= 350) {
    return "...";
  }

  return "";
}

function isQuestion(text: string) {
  return /\?\s*$/.test(text) || /^(can|could|would|will|do|does|did|is|are|may|shall|what|when|where|which|who|why|how)\b/i.test(text);
}

function isNewTopicStart(text: string) {
  return /^(now|next|finally|before we finish|one more thing|let me explain|moving on)\b/i.test(
    text,
  );
}

function isInformationListing(text: string) {
  return /\b(phone|number|address|postcode|postal code|email|surname|spell|spelled|card|fee|cost|price|time|date|street|flat|room)\b/i.test(
    text,
  );
}

function getStableJitter(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 997;
  }

  return hash;
}
