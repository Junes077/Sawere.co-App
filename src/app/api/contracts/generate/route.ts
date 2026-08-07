import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/ai/claude";
import { generateDraftSchema } from "@/lib/validators/document-template";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const parsed = generateDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const template = await prisma.documentTemplate.findFirst({
    where: { id: parsed.data.templateId, firmId: user.firmId },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const [client, caseRecord] = await Promise.all([
    parsed.data.clientId
      ? prisma.client.findFirst({ where: { id: parsed.data.clientId, firmId: user.firmId } })
      : null,
    parsed.data.caseId ? prisma.case.findFirst({ where: { id: parsed.data.caseId, firmId: user.firmId } }) : null,
  ]);

  let claude;
  try {
    claude = getClaudeClient();
  } catch {
    return NextResponse.json(
      { error: "AI is not configured yet. Add ANTHROPIC_API_KEY to enable document generation." },
      { status: 503 },
    );
  }

  const contextLines = [
    client && `Client: ${client.fullName}${client.companyName ? ` (${client.companyName})` : ""}`,
    caseRecord && `Case: ${caseRecord.title} [${caseRecord.caseNumber}]`,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You draft legal documents for a law firm, matching the firm's own template style exactly (tone, structure, headings, greetings, closings). Always add a "DRAFT — for advocate review" notice at the top. Never invent facts not given to you; use clear placeholders like [DETAIL NEEDED] where information is missing.`,
    messages: [
      {
        role: "user",
        content: `TEMPLATE (${template.name} — ${template.category}), use as the style and structure reference:
---
${template.bodyMarkdown}
---

${contextLines ? `CONTEXT:\n${contextLines}\n` : ""}
INSTRUCTIONS FOR THIS DRAFT:
${parsed.data.instructions}`,
      },
    ],
  });

  const draft = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return NextResponse.json({ draft });
}
