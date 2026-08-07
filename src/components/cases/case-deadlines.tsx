"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatDate } from "@/lib/utils";
import type { CaseDeadline } from "@prisma/client";

export function CaseDeadlines({ caseId, deadlines }: { caseId: string; deadlines: CaseDeadline[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    setLoading(true);

    const res = await fetch(`/api/cases/${caseId}/deadlines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueAt: new Date(dueAt).toISOString() }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't add the deadline.");
      return;
    }
    setTitle("");
    setDueAt("");
    router.refresh();
  }

  async function toggle(deadlineId: string, isCompleted: boolean) {
    const res = await fetch(`/api/cases/${caseId}/deadlines`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlineId, isCompleted }),
    });
    if (!res.ok) {
      toast.error("Couldn't update the deadline.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deadline, e.g. File defence"
          className="flex-1"
        />
        <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="sm:w-44" />
        <Button type="submit" size="sm" disabled={loading || !title.trim() || !dueAt}>
          {loading && <Loader2 className="animate-spin" />}
          Add
        </Button>
      </form>

      {deadlines.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No deadlines tracked" />
      ) : (
        <ul className="flex flex-col gap-2">
          {deadlines.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <button
                type="button"
                onClick={() => toggle(d.id, !d.isCompleted)}
                className="text-muted-foreground hover:text-accent"
                aria-label={d.isCompleted ? "Mark incomplete" : "Mark complete"}
              >
                {d.isCompleted ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium text-foreground", d.isCompleted && "line-through text-muted-foreground")}>
                  {d.title}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(d.dueAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
