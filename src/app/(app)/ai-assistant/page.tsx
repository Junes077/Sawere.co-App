import { requireUser } from "@/lib/auth";
import { listConversations, getConversation } from "@/lib/data/ai";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantShell } from "@/components/ai-assistant/assistant-shell";

export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await requireUser();
  const { c } = await searchParams;

  const [conversations, activeConversation] = await Promise.all([
    listConversations(user.firmId, user.id),
    c ? getConversation(user.firmId, user.id, c) : null,
  ]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="AI Assistant" description="Grounded in your firm's clients, cases, calendar and tasks." />
      <AssistantShell
        key={activeConversation?.id ?? "new"}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        initialMessages={activeConversation?.messages ?? []}
      />
    </div>
  );
}
