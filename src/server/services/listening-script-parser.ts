export type ListeningScriptSegment = {
  speaker: string | null;
  text: string;
};

const SPEAKER_LINE_PATTERN = /^\s*([A-Za-z][A-Za-z\s.'-]{0,48})\s*:\s*(.+?)\s*$/;
const ANY_SPEAKER_LABEL_PATTERN = /^[A-Za-z][A-Za-z\s.'-]{0,48}\s*:\s*/gm;

export function parseListeningScript(script: string): ListeningScriptSegment[] {
  return script
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(SPEAKER_LINE_PATTERN);

      if (!match) {
        return {
          speaker: null,
          text: line,
        };
      }

      return {
        speaker: match[1].trim(),
        text: match[2].trim(),
      };
    })
    .filter((segment) => Boolean(segment.text));
}

export function buildTtsDialogueText(segments: ListeningScriptSegment[]) {
  return segments
    .map((segment) => stripSpeakerLabels(segment.text))
    .join("\n\n")
    .trim();
}

export function stripSpeakerLabels(text: string) {
  return text.replace(ANY_SPEAKER_LABEL_PATTERN, "").trim();
}

export function hasSpeakerLabels(text: string) {
  ANY_SPEAKER_LABEL_PATTERN.lastIndex = 0;
  return ANY_SPEAKER_LABEL_PATTERN.test(text);
}
