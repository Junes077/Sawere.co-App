import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";

export async function POST() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const tasks = await prisma.task.findMany({
    where: { firmId: user.firmId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    include: { client: true, case: true },
  });

  if (tasks.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  let claude;
  try {
    claude = getClaudeClient();
  } catch {
    return NextResponse.json(
      { error: "AI is not configured yet. Add ANTHROPIC_API_KEY to enable this." },
      { status: 503 },
    );
  }

  const now = new Date();
  const taskList = tasks
    .map(
      (t) =>
        `- id: ${t.id} | title: "${t.title}" | current priority: ${t.priority} | due: ${
          t.dueAt ? t.dueAt.toISOString() : "no due date"
        } | client: ${t.client?.fullName ?? "—"} | case: ${t.case?.title ?? "—"}`,
    )
    .join("\n");

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: `You triage a law firm's task list. Today is ${now.toISOString()}. Score each task's urgency 0-100 (100 = most urgent — overdue court/legal deadlines outrank everything). Respond with ONLY a JSON array like [{"id":"...","score":87}] and nothing else — no prose, no markdown fences.`,
    messages: [{ role: "user", content: taskList }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let scores: { id: string; score: number }[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    scores = JSON.parse(match ? match[0] : text);
  } catch {
    return NextResponse.json({ error: "AI returned an unexpected response. Try again." }, { status: 502 });
  }

  await Promise.all(
    scores
      .filter((s) => typeof s.id === "string" && typeof s.score === "number")
      .map((s) =>
        prisma.task.update({
          where: { id: s.id },
          data: { aiPriorityScore: Math.max(0, Math.min(100, Math.round(s.score))) },
        }),
      ),
  );

  return NextResponse.json({ updated: scores.length });
}
