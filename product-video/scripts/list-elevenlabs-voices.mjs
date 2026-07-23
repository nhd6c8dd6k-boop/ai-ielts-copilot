const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  throw new Error("Missing ELEVENLABS_API_KEY.");
}

const response = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: {
    "xi-api-key": apiKey,
  },
});

if (!response.ok) {
  throw new Error(`ElevenLabs voices failed: ${response.status} ${await response.text()}`);
}

const payload = await response.json();

for (const voice of payload.voices ?? []) {
  console.log(
    [
      voice.voice_id,
      voice.name,
      voice.category,
      voice.labels?.accent,
      voice.labels?.gender,
      voice.labels?.description,
    ]
      .filter(Boolean)
      .join(" | "),
  );
}
