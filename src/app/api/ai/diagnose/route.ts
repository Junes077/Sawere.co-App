import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Visit this route directly in the browser while logged in. It checks auth,
 * the database, and the Claude API independently and reports which one (if
 * any) is failing and why — instead of the AI chat route's single opaque
 * failure. Safe to leave in the codebase; it requires a logged-in session
 * and never touches production conversation data.
 */
export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  let user;
  try {
    const auth = await requireApiUser();
    if ("response" in auth) {
      results.auth = { ok: false, detail: "Not logged in (401) — sign in and reload this page." };
      return Response.json(results, { status: 200 });
    }
    user = auth.user;
    results.auth = { ok: true, detail: `Logged in as ${user.email ?? user.id}` };
  } catch (err) {
    results.auth = { ok: false, detail: describeError(err) };
    return Response.json(results, { status: 200 });
  }

  try {
    const count = await prisma.user.count({ where: { firmId: user.firmId } });
    results.database = { ok: true, detail: `Connected. ${count} user(s) in your firm.` };
  } catch (err) {
    results.database = { ok: false, detail: describeError(err) };
  }

  try {
    const claude = getClaudeClient();
    const reply = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 20,
      messages: [{ role: "user", content: "Reply with just the word OK." }],
    });
    const text = reply.content.find((b) => b.type === "text")?.text ?? "(no text block)";
    results.claude = { ok: true, detail: `Responded: "${text.trim()}"` };
  } catch (err) {
    results.claude = { ok: false, detail: describeError(err) };
  }

  return Response.json(results, { status: 200 });
}

function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}
