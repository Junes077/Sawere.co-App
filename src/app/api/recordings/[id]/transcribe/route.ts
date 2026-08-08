import { NextResponse } from "next/server";
import { toFile } from "openai";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";
import { getOpenAIClient, WHISPER_MODEL } from "@/lib/ai/openai";
import { RECORDINGS_BUCKET } from "@/lib/data/meetings";

export const runtime = "nodejs";
export const maxDuration = 120;

const SUMMARY_SYSTEM_PROMPT =
  'You summarize legal client/case meeting transcripts. Respond with ONLY valid JSON of the shape ' +
  '{"summary": string, "actionItems": string[]}. The summary is 2-4 sentences. Action items are short, ' +
  "imperative next steps for the advocate. Use an empty array if there are none.";

function extensionFor(mimeType: string | null) {
  if (mimeType?.includes("mp4")) return "mp4";
  if (mimeType?.includes("ogg")) return "ogg";
  if (mimeType?.includes("wav")) return "wav";
  return "webm";
}

/** Downloads the recorded audio, transcribes it (OpenAI Whisper), then asks
 * Claude for a summary and action items. Summarization is best-effort — a
 * missing ANTHROPIC_API_KEY still leaves the raw transcript in place. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const recording = await prisma.recording.findFirst({
    where: { id, meeting: { firmId: user.firmId } },
  });
  if (!recording) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recording.update({ where: { id }, data: { status: "TRANSCRIBING" } });

  try {
    const admin = createAdminClient();
    const { data: audio, error: downloadError } = await admin.storage
      .from(RECORDINGS_BUCKET)
      .download(recording.storagePath);
    if (downloadError || !audio) throw new Error("Could not read the recording");

    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buffer, `recording.${extensionFor(recording.mimeType)}`, {
      type: recording.mimeType ?? "audio/webm",
    });

    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({ file, model: WHISPER_MODEL });
    const text = transcription.text?.trim();
    if (!text) throw new Error("The recording produced no transcribable audio");

    let summary = "";
    let actionItems: string[] = [];
    try {
      const claude = getClaudeClient();
      const completion = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      });
      const raw = completion.content.find((block) => block.type === "text")?.text ?? "{}";
      const parsed = JSON.parse(raw);
      summary = typeof parsed.summary === "string" ? parsed.summary : "";
      actionItems = Array.isArray(parsed.actionItems)
        ? parsed.actionItems.filter((item: unknown): item is string => typeof item === "string")
        : [];
    } catch {
      // Best-effort: keep the raw transcript even if summarization fails.
    }

    const transcript = await prisma.transcript.upsert({
      where: { recordingId: id },
      create: { recordingId: id, text, summary, actionItems },
      update: { text, summary, actionItems },
    });

    const updated = await prisma.recording.update({ where: { id }, data: { status: "TRANSCRIBED" } });

    return NextResponse.json({ recording: updated, transcript });
  } catch (err) {
    await prisma.recording.update({ where: { id }, data: { status: "FAILED" } });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 },
    );
  }
}
