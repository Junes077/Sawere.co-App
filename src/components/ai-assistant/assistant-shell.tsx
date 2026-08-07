"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Send, Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AiConversation, AiMessage } from "@prisma/client";

type ChatMessage = { role: "USER" | "ASSISTANT"; content: string; pending?: boolean };

export function AssistantShell({
  conversations,
  activeConversationId,
  initialMessages,
}: {
  conversations: AiConversation[];
  activeConversationId?: string;
  initialMessages: AiMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((m) => ({ role: m.role as "USER" | "ASSISTANT", content: m.content })),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content: text }, { role: "ASSISTANT", content: "", pending: true }]);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversationId, message: text }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "The assistant couldn't respond.");
      }

      const newConversationId = res.headers.get("X-Conversation-Id");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "ASSISTANT", content: acc, pending: true };
          return next;
        });
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ASSISTANT", content: acc };
        return next;
      });

      if (newConversationId && newConversationId !== activeConversationId) {
        router.push(`/ai-assistant?c=${newConversationId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden w-64 shrink-0 flex-col rounded-xl border border-border bg-card md:flex">
        <div className="p-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/ai-assistant">
              <Plus /> New chat
            </Link>
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 pb-2">
          <div className="flex flex-col gap-1">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/ai-assistant?c=${c.id}`}
                className={cn(
                  "truncate rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  c.id === activeConversationId ? "bg-secondary font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Sparkles className="size-6" />
              </span>
              <p className="max-w-sm text-sm">
                Ask about your clients, cases, calendar or tasks. I only answer from your firm&apos;s
                actual records.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm",
                      m.role === "USER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {m.content || (m.pending ? <Loader2 className="size-4 animate-spin" /> : "")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border p-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant…"
            rows={1}
            className="max-h-32 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </div>
    </div>
  );
}
