import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily-constructed OpenAI client so the app can boot without an API key. */
export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local to enable meeting transcription.",
    );
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const WHISPER_MODEL = "whisper-1";
