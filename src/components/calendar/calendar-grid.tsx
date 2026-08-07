import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import type { CalendarEvent, Client, Case } from "@prisma/client";

type EventWithRelations = CalendarEvent & { client: Client | null; case: Case | null };

const TYPE_DOT: Record<string, string> = {
  COURT_DATE: "bg-destructive",
  MEETING: "bg-navy dark:bg-gold-soft",
  DEADLINE: "bg-warning",
  EXPIRY_REMINDER: "bg-gold",
  OTHER: "bg-muted-foreground",
};

export function CalendarGrid({
  days,
  eventsByDay,
  currentMonth,
  today,
  clients,
  cases,
}: {
  days: Date[];
  eventsByDay: Map<string, EventWithRelations[]>;
  currentMonth: number;
  today: string;
  clients: Client[];
  cases: Case[];
}) {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="bg-secondary px-2 py-2 text-center text-xs font-medium text-muted-foreground">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const events = eventsByDay.get(key) ?? [];
        const inMonth = day.getMonth() === currentMonth;
        const isToday = key === today;

        return (
          <div
            key={key}
            className={cn(
              "group min-h-28 bg-card p-2 transition-colors",
              !inMonth && "bg-secondary/40 text-muted-foreground/60",
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-gold text-navy",
                )}
              >
                {day.getDate()}
              </span>
              <EventFormDialog
                defaultDate={key}
                clients={clients}
                cases={cases}
                trigger={
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-secondary group-hover:opacity-100"
                    aria-label="Add event"
                  >
                    <Plus className="size-3.5" />
                  </button>
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              {events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-1.5 truncate rounded bg-secondary px-1.5 py-0.5 text-[11px] text-foreground"
                  title={event.title}
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", TYPE_DOT[event.type])} />
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
              {events.length > 3 && (
                <span className="text-[11px] text-muted-foreground">+{events.length - 3} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
