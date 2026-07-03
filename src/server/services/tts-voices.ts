import type { TtsVoice } from "@/server/services/tts";

const FEMALE_ROLE_PATTERN =
  /(receptionist|assistant|woman|female|librarian|clerk|staff|adviser|advisor|operator|secretary|sarah|anna|ms\.?|mrs\.?)/i;
const MALE_ROLE_PATTERN =
  /(student|man|male|customer|applicant|visitor|candidate|caller|daniel|david|james|john|mr\.?)/i;

export function getVoiceForSpeaker(speaker: string | null): TtsVoice {
  if (!speaker) {
    return "alloy";
  }

  if (FEMALE_ROLE_PATTERN.test(speaker)) {
    return "nova";
  }

  if (MALE_ROLE_PATTERN.test(speaker)) {
    return "onyx";
  }

  return "alloy";
}

export function summarizeVoiceMapping(
  voices: Array<{ speaker: string | null; voice: TtsVoice }>,
) {
  const summary = new Map<string, TtsVoice>();

  for (const item of voices) {
    summary.set(item.speaker ?? "Narrator", item.voice);
  }

  return Array.from(summary.entries()).map(([speaker, voice]) => ({
    speaker,
    voice,
  }));
}
