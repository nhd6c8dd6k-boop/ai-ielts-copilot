import { mkdir, writeFile } from "node:fs/promises";
import { stdin } from "node:process";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const OUTPUT_DIR = new URL("../public/voiceover/", import.meta.url);

const scenes = [
  {
    id: "01-hook",
    text: "You got a Band score. But what should you actually fix next?",
  },
  {
    id: "02-brand",
    text: "Meet AI IELTS Copilot. IELTS practice with AI feedback you can use in your next essay.",
  },
  {
    id: "03-feedback",
    text: "Submit a Task 1 or Task 2 response, then see your overall Band, criterion scores, and clear reasons.",
  },
  {
    id: "04-rewrite",
    text: "You also get sentence rewrites: original, improved, and why the change works.",
  },
  {
    id: "05-exam",
    text: "Practice Reading and Listening in a computer-based IELTS style workspace, with timers, answer navigation, and automatic scoring.",
  },
  {
    id: "06-dashboard",
    text: "Your dashboard keeps the record, tracks progress, and suggests the next move.",
  },
  {
    id: "07-cta",
    text: "Try one AI Writing feedback free today at aiieltscopilot.com.",
  },
];

async function readStdin() {
  let input = "";
  stdin.setEncoding("utf8");

  for await (const chunk of stdin) {
    input += chunk;
  }

  return input.trim();
}

async function generateScene(apiKey, scene) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: scene.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.78,
          style: 0.36,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`ElevenLabs failed for ${scene.id}: ${response.status} ${message}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

const apiKey = process.env.ELEVENLABS_API_KEY || (await readStdin());

if (!apiKey) {
  throw new Error("Missing ElevenLabs API key on stdin.");
}

await mkdir(OUTPUT_DIR, { recursive: true });

for (const scene of scenes) {
  const audio = await generateScene(apiKey, scene);
  await writeFile(new URL(`${scene.id}.mp3`, OUTPUT_DIR), audio);
  console.log(`Generated ${scene.id}.mp3 (${audio.length} bytes)`);
}
