#!/usr/bin/env node

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey?.trim()) {
  throw new Error("ELEVENLABS_API_KEY is not configured.");
}

const response = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: {
    "xi-api-key": apiKey,
  },
});

if (!response.ok) {
  throw new Error(`Failed to list ElevenLabs voices. Status: ${response.status}`);
}

const payload = await response.json();
const voices = Array.isArray(payload.voices) ? payload.voices : [];

console.table(
  voices.map((voice) => ({
    name: voice.name,
    voice_id: voice.voice_id,
    category: voice.category ?? "",
    accent: voice.labels?.accent ?? "",
    gender: voice.labels?.gender ?? "",
    age: voice.labels?.age ?? "",
    description: voice.description ?? "",
  })),
);
