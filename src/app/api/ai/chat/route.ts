import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClaudeClient, CLAUDE_MODEL, LEGAL_ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { buildFirmContext } from "@/lib/data/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let conversation;
  let claude;
  let firmContext: string;
  let user;
  let userMessage: string;
  try {
    const auth = await requireApiUser();
    if ("response" in auth) return auth.response;
    user = auth.user;

    const body = await request.json().catch(() => null);
    const conversationId: string | undefined = body?.conversationId;
    const message: string | undefined = body?.message;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }
    userMessage = message;

    conversation = conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: conversationId, firmId: user.firmId, userId: user.id },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
        })
      : await prisma.aiConversation.create({
          data: { firmId: user.firmId, userId: user.id },
          include: { messages: true },
        });

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
    }

    await prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: userMessage },
    });

    if (conversation.messages.length === 0) {
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { title: userMessage.slice(0, 60) },
      });
    }

    claude = getClaudeClient();
    firmContext = await buildFirmContext(user.firmId);
  } catch (err) {
    console.error("AI chat setup failed", err);
    const message =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? "AI is not configured yet. Add ANTHROPIC_API_KEY to enable the assistant."
        : err instanceof Error
          ? err.message
          : "Something went wrong preparing the assistant.";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  const history = conversation.messages.map((m) => ({
    role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  let stream;
  try {
    stream = claude.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 450,
      system: `${LEGAL_ASSISTANT_SYSTEM_PROMPT}\n\n${firmContext}`,
      messages: [...history, { role: "user", content: userMessage }],
    });
  } catch (err) {
    console.error("Claude stream setup failed", err);
    const message = err instanceof Error ? err.message : "The assistant couldn't respond.";
    return new Response(JSON.stringify({ error: message }), { status: 502 });
  }

  let fullText = "";
  const encoder = new TextEncoder();

  const body_ = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => {
        fullText += delta;
        controller.enqueue(encoder.encode(delta));
      });
      stream.on("end", () => {
        controller.close();
        prisma.aiMessage
          .create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: fullText } })
          .then(() => prisma.aiConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }))
          .catch((err) => console.error("Failed to persist AI assistant reply", err));
      });
      stream.on("error", (err) => {
        console.error("Claude stream error", err);
        controller.error(err);
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body_, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": conversation.id,
    },
  });
}
