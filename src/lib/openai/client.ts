import OpenAI from "openai";

import { env, requireEnv } from "@/lib/env";

export function createOpenAIClient() {
  return new OpenAI({
    apiKey: requireEnv(env.openaiApiKey, "OPENAI_API_KEY"),
  });
}
