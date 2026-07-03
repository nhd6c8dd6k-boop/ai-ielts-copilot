import type { TtsVoice } from "@/server/services/tts";

export type TtsVoiceStrategy = "multi_voice" | "single_narrator";

export type ListeningTtsProfile = {
  section: number;
  speed: number;
  pauseMultiplier: number;
  voiceStrategy: TtsVoiceStrategy;
  narratorVoice: TtsVoice;
  pauseStrategy: string;
  styleInstruction: string;
};

export function getListeningTtsProfile(section?: number | null): ListeningTtsProfile {
  switch (section) {
    case 2:
      return {
        section: 2,
        speed: 0.95,
        pauseMultiplier: 1,
        voiceStrategy: "single_narrator",
        narratorVoice: "alloy",
        pauseStrategy: "medium pauses for a clear public information talk",
        styleInstruction:
          "This is IELTS Listening Section 2: a single speaker giving a practical introduction or public information talk. Keep the pace clear, organised, and moderately dense.",
      };
    case 3:
      return {
        section: 3,
        speed: 0.99,
        pauseMultiplier: 0.82,
        voiceStrategy: "multi_voice",
        narratorVoice: "alloy",
        pauseStrategy: "shorter pauses for a natural academic discussion",
        styleInstruction:
          "This is IELTS Listening Section 3: an academic discussion with natural interaction, mild interruptions, and more implied detail. Keep it conversational but clear.",
      };
    case 4:
      return {
        section: 4,
        speed: 1,
        pauseMultiplier: 0.72,
        voiceStrategy: "single_narrator",
        narratorVoice: "sage",
        pauseStrategy: "minimal pauses for a continuous academic lecture",
        styleInstruction:
          "This is IELTS Listening Section 4: a continuous academic lecture. Use a confident lecturer style, fewer pauses, and higher information density while remaining intelligible.",
      };
    case 1:
    default:
      return {
        section: 1,
        speed: 0.92,
        pauseMultiplier: 1.18,
        voiceStrategy: "multi_voice",
        narratorVoice: "alloy",
        pauseStrategy: "slightly longer pauses for a clear daily service conversation",
        styleInstruction:
          "This is IELTS Listening Section 1: a daily service conversation. Keep pronunciation very clear, information direct, and pauses slightly longer before answers.",
      };
  }
}
