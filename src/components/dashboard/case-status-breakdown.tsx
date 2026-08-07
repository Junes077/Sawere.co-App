import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  WON: "Won",
  LOST: "Lost",
  SETTLED: "Settled",
  CLOSED: "Closed",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-gold",
  IN_PROGRESS: "bg-navy dark:bg-gold-soft",
  ON_HOLD: "bg-warning",
  WON: "bg-success",
  LOST: "bg-destructive",
  SETTLED: "bg-success/70",
  CLOSED: "bg-muted-foreground",
};

export function CaseStatusBreakdown({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        {data.map((d) => (
          <div
            key={d.status}
            className={cn(STATUS_COLOR[d.status] ?? "bg-muted-foreground")}
            style={{ width: `${(d.count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", STATUS_COLOR[d.status] ?? "bg-muted-foreground")} />
            <span className="text-muted-foreground">{STATUS_LABEL[d.status] ?? d.status}</span>
            <span className="ml-auto font-medium text-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
