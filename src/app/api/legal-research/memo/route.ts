import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const memoSchema = z.object({
  question: z.string().min(4).max(1000),
  noteIds: z.array(z.string().uuid()).min(1, "Select at least one saved source"),
});

const SYSTEM_PROMPT = `You draft internal legal research memos for a Tanzanian law firm. You are given a
research question and a list of sources the advocate has already saved (title, citation, court, a short
summary if they wrote one, and the source link) — you do NOT have the full text of these documents, only
what's listed. Structure your memo with these exact headings: Research Question, Issues, Applicable Law,
Relevant Legislation, Relevant Cases, Key Principles, Analysis, Counterarguments, Further Research Needed,
Sources. Base "Relevant Cases"/"Relevant Legislation" and any legal principle strictly on the sources
given — do not invent case names, citations, statutes or holdings that are not in the provided list, and
do not state details of a case's reasoning you were not given. Where the sources don't fully answer the
question, say so explicitly under "Further Research Needed" rather than filling the gap from general
knowledge presented as settled Tanzanian law. This is a draft for advocate review, not legal advice.`;

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = memoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { question, noteIds } = parsed.data;

  try {
    const notes = await prisma.legalResearchNote.findMany({
      where: { id: { in: noteIds }, firmId: auth.user.firmId },
    });
    if (notes.length === 0) {
      return NextResponse.json({ error: "None of the selected sources could be found" }, { status: 404 });
    }

    const sourcesText = notes
      .map((n, i) => {
        const parts = [
          `${i + 1}. ${n.title}`,
          n.citation ? `Citation: ${n.citation}` : null,
          n.court ? `Court: ${n.court}` : null,
          n.sourceType ? `Type: ${n.sourceType}` : null,
          n.jurisdiction ? `Jurisdiction: ${n.jurisdiction}` : null,
          n.summary ? `Summary: ${n.summary}` : null,
          n.sourceUrl ? `Source: ${n.sourceUrl}` : null,
        ].filter(Boolean);
        return parts.join("\n   ");
      })
      .join("\n\n");

    const claude = getClaudeClient();
    const reply = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Research question: ${question}\n\nSaved sources:\n${sourcesText}`,
        },
      ],
    });
    const memo = reply.content.find((b) => b.type === "text")?.text?.trim() ?? "";
    return NextResponse.json({ memo });
  } catch (err) {
    console.error("Legal research memo generation failed", err);
    const message = err instanceof Error ? err.message : "Couldn't generate a memo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
