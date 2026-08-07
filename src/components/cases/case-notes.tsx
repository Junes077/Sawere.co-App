"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { CaseNote, User } from "@prisma/client";

export function CaseNotes({
  caseId,
  notes,
}: {
  caseId: string;
  notes: (CaseNote & { author: User })[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/cases/${caseId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't save the note.");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this case…"
          rows={3}
        />
        <Button type="submit" size="sm" className="self-end" disabled={loading || !body.trim()}>
          {loading && <Loader2 className="animate-spin" />}
          Add note
        </Button>
      </form>

      {notes.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No notes yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border p-3">
              <p className="text-sm whitespace-pre-line text-foreground/90">{note.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.author.fullName} · {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
