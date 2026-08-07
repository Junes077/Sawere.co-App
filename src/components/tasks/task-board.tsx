"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, ListChecks } from "lucide-react";
import { isToday, isThisWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskRow } from "@/components/tasks/task-row";
import type { Case, Client, Task, User } from "@prisma/client";

type TaskWithRelations = Task & { client: Client | null; case: Case | null; assignee: User | null };

function sortByAiThenPriority(tasks: TaskWithRelations[]) {
  const priorityRank = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
  return [...tasks].sort((a, b) => {
    if (a.aiPriorityScore != null || b.aiPriorityScore != null) {
      return (b.aiPriorityScore ?? -1) - (a.aiPriorityScore ?? -1);
    }
    return priorityRank[b.priority] - priorityRank[a.priority];
  });
}

export function TaskBoard({ tasks }: { tasks: TaskWithRelations[] }) {
  const router = useRouter();
  const [prioritizing, setPrioritizing] = useState(false);

  const pending = useMemo(() => tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"), [tasks]);
  const todays = useMemo(() => pending.filter((t) => t.dueAt && isToday(t.dueAt)), [pending]);
  const thisWeek = useMemo(() => pending.filter((t) => t.dueAt && isThisWeek(t.dueAt, { weekStartsOn: 1 })), [pending]);
  const completed = useMemo(() => tasks.filter((t) => t.status === "COMPLETED"), [tasks]);

  async function handlePrioritize() {
    setPrioritizing(true);
    const res = await fetch("/api/tasks/ai-prioritize", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setPrioritizing(false);

    if (!res.ok) {
      toast.error(json.error ?? "Couldn't get AI priority suggestions");
      return;
    }
    toast.success("Tasks re-ranked by urgency");
    router.refresh();
  }

  return (
    <Tabs defaultValue="pending">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="today">Today ({todays.length})</TabsTrigger>
          <TabsTrigger value="week">This week ({thisWeek.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" onClick={handlePrioritize} disabled={prioritizing || pending.length === 0}>
          {prioritizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          AI priority suggestions
        </Button>
      </div>

      <TabsContent value="today">
        {todays.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nothing due today" />
        ) : (
          <div className="flex flex-col gap-2">
            {sortByAiThenPriority(todays).map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="week">
        {thisWeek.length === 0 ? (
          <EmptyState icon={ListChecks} title="Nothing due this week" />
        ) : (
          <div className="flex flex-col gap-2">
            {sortByAiThenPriority(thisWeek).map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="pending">
        {pending.length === 0 ? (
          <EmptyState icon={ListChecks} title="You're all caught up" />
        ) : (
          <div className="flex flex-col gap-2">
            {sortByAiThenPriority(pending).map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="completed">
        {completed.length === 0 ? (
          <EmptyState icon={ListChecks} title="No completed tasks yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {completed.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
