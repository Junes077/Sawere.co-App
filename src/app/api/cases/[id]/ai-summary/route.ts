import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: { id, firmId: user.firmId },
    include: {
      client: true,
      notes: { orderBy: { createdAt: "desc" }, take: 20 },
      deadlines: true,
      documents: { select: { fileName: true, category: true, extractedText: true } },
    },
  });
  if (!caseRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let claude;
  try {
    claude = getClaudeClient();
  } catch {
    return NextResponse.json(
      { error: "AI is not configured yet. Add ANTHROPIC_API_KEY in your environment to enable summaries." },
      { status: 503 },
    );
  }

  const context = `Case: ${caseRecord.title} (${caseRecord.caseNumber})
Type: ${caseRecord.caseType}
Status: ${caseRecord.status}
Client: ${caseRecord.client.fullName}
Court: ${caseRecord.court ?? "N/A"}
Judge: ${caseRecord.judge ?? "N/A"}
Opposing party: ${caseRecord.opposingParty ?? "N/A"}

Open deadlines: ${caseRecord.deadlines.filter((d) => !d.isCompleted).map((d) => `${d.title} (${d.dueAt.toDateString()})`).join("; ") || "None"}

Case notes (most recent first):
${caseRecord.notes.map((n) => `- ${n.body}`).join("\n") || "No notes yet."}

Documents on file: ${caseRecord.documents.map((d) => d.fileName).join(", ") || "None"}`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system:
      "You write concise legal case summaries for an advocate's internal dashboard. Summarize only from the facts given — never invent case details. 3-5 sentences, plain language, then a short bullet list of open items.",
    messages: [{ role: "user", content: context }],
  });

  const summary = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const updated = await prisma.case.update({
    where: { id },
    data: { aiSummary: summary },
  });

  return NextResponse.json({ aiSummary: updated.aiSummary });
}
