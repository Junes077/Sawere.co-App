import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

const explainSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().max(500).optional().or(z.literal("")),
  query: z.string().min(1).max(300),
});

const SYSTEM_PROMPT = `You help a Tanzanian advocate judge whether a search result is worth opening.
You are given ONLY a document title/citation and the advocate's search query — you have not read the
document itself. Write 1-2 short sentences on why this title looks relevant (or not) to the query,
based on what the title alone suggests. Never state or imply facts about the case's holding, parties,
outcome or reasoning — you don't have that document's content. If the title gives no real signal either
way, say so plainly instead of guessing.`;

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;

  const parsed = explainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { title, url, query } = parsed.data;

  try {
    const claude = getClaudeClient();
    const reply = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Search query: "${query}"\nResult title: "${title}"${url ? `\nSource: ${url}` : ""}`,
        },
      ],
    });
    const text = reply.content.find((b) => b.type === "text")?.text?.trim() ?? "";
    return NextResponse.json({ explanation: text });
  } catch (err) {
    console.error("Legal research explain failed", err);
    const message = err instanceof Error ? err.message : "Couldn't generate an explanation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
