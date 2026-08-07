"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Case, Client, Task, User } from "@prisma/client";

type TaskRowData = Task & { client: Client | null; case: Case | null; assignee: User | null };

export function TaskRow({ task }: { task: TaskRowData }) {
  const router = useRouter();
  const isDone = task.status === "COMPLETED";

  async function toggleComplete() {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isDone ? "PENDING" : "COMPLETED" }),
    });
    if (!res.ok) {
      toast.error("Couldn't update the task");
      return;
    }
    router.refresh();
  }

  async function remove() {
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete the task");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <button
        type="button"
        onClick={toggleComplete}
        className="text-muted-foreground hover:text-accent"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-foreground", isDone && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {task.client?.fullName ?? task.case?.title ?? "General"}
          {task.assignee && ` · ${task.assignee.fullName}`}
          {task.dueAt && ` · Due ${formatDate(task.dueAt)}`}
        </p>
      </div>
      {task.aiPriorityScore != null && (
        <Badge variant="gold" className="gap-1">
          <Sparkles className="size-3" /> {task.aiPriorityScore}
        </Badge>
      )}
      <Badge variant={task.priority === "URGENT" ? "destructive" : task.priority === "HIGH" ? "gold" : "outline"}>
        {task.priority}
      </Badge>
      <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete task">
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}
