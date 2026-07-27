import assert from "node:assert/strict";

import { ELEVENLABS_LISTENING_SETS } from "./elevenlabs-listening-content.mjs";
import { validateListeningPracticeSets } from "./generate-elevenlabs-listening-practices.mjs";
import {
  ElevenLabsTtsError,
  generateElevenLabsDialogueAudio,
  validateElevenLabsDialogueInputs,
} from "../src/server/services/elevenlabs-tts.ts";

const summaries = validateListeningPracticeSets(ELEVENLABS_LISTENING_SETS);

assert.equal(ELEVENLABS_LISTENING_SETS.length, 5);
assert.equal(new Set(ELEVENLABS_LISTENING_SETS.map((set) => set.seedKey)).size, 5);

for (const summary of summaries) {
  assert.equal(summary.questions, 10);
  assert.ok(summary.scriptCharacters > 0);
  assert.ok(summary.scriptCharacters <= 2000);
}

for (const practiceSet of ELEVENLABS_LISTENING_SETS) {
  assert.equal(practiceSet.questions.length, 10);

  for (const question of practiceSet.questions) {
    assert.ok(question.answer.trim());

    if (question.options.length) {
      assert.ok(question.options.includes(question.answer));
    }
  }
}

assert.throws(
  () =>
    validateElevenLabsDialogueInputs([
      { text: "Receptionist: Good morning.", voiceId: "voice-a" },
    ]),
  /speaker role labels/i,
);

assert.throws(
  () =>
    validateElevenLabsDialogueInputs([
      { text: "A".repeat(2001), voiceId: "voice-a" },
    ]),
  /at or below 2000/i,
);

assert.throws(
  () => validateElevenLabsDialogueInputs([{ text: "Good morning.", voiceId: "" }]),
  /voice_id/i,
);

assert.rejects(
  () =>
    generateElevenLabsDialogueAudio({
      inputs: [{ text: "Good morning.", voiceId: "voice-a" }],
      apiKey: "",
      fetchImpl: async () => {
        throw new Error("fetch should not be called without an API key");
      },
    }),
  (error) =>
    error instanceof ElevenLabsTtsError && error.code === "missing_api_key",
);

let fetchCalled = false;
const fakeAudio = Buffer.concat([
  Buffer.from([0xff, 0xfb, 0x90, 0x64]),
  Buffer.alloc(24 * 1024, 1),
]);
const audioResult = await generateElevenLabsDialogueAudio({
  inputs: [{ text: "Good morning. How can I help you?", voiceId: "voice-a" }],
  apiKey: "test-key",
  fetchImpl: async (url, init) => {
    fetchCalled = true;
    assert.match(String(url), /\/v1\/text-to-dialogue\?output_format=mp3_44100_128/);
    assert.equal(init?.method, "POST");
    assert.equal(init?.headers?.["xi-api-key"], "test-key");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model_id, "eleven_v3");
    assert.equal(body.inputs[0].text, "Good morning. How can I help you?");
    assert.equal(body.inputs[0].voiceId, undefined);
    assert.equal(body.inputs[0].voice_id, "voice-a");

    return new Response(fakeAudio, {
      status: 200,
      headers: { "content-type": "audio/mpeg" },
    });
  },
});

assert.equal(fetchCalled, true);
assert.equal(audioResult.provider, "elevenlabs");
assert.equal(audioResult.model, "eleven_v3");
assert.ok(audioResult.audioBuffer.length > 20 * 1024);

console.log("ElevenLabs Listening generation checks passed.");
