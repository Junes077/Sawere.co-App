import Link from "next/link";
import { Users, Briefcase, ListChecks, Receipt, CalendarClock, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { CaseStatusBreakdown } from "@/components/dashboard/case-status-breakdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.firmId);

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${user.fullName.split(" ")[0]}`}
        description="Here's what's happening across the firm today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active clients" value={String(stats.clientCount)} icon={Users} />
        <StatCard label="Open cases" value={String(stats.openCaseCount)} icon={Briefcase} accent />
        <StatCard label="Pending tasks" value={String(stats.pendingTaskCount)} icon={ListChecks} />
        <StatCard
          label="Outstanding invoices"
          value={formatCurrency(stats.unpaidTotal)}
          icon={Receipt}
          hint={`${stats.unpaidCount} invoice${stats.unpaidCount === 1 ? "" : "s"} unpaid`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue, last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.casesByStatus.length > 0 ? (
              <CaseStatusBreakdown data={stats.casesByStatus} />
            ) : (
              <p className="text-sm text-muted-foreground">No cases logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                View calendar <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.upcomingEvents.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing scheduled"
                description="Court dates, meetings and deadlines will show up here."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="flex flex-col items-center rounded-md bg-secondary px-2 py-1 text-center leading-tight">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {new Date(event.startsAt).toLocaleString("en-KE", { month: "short" })}
                      </span>
                      <span className="font-serif text-lg text-foreground">
                        {new Date(event.startsAt).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.startsAt)}
                        {event.client && ` · ${event.client.fullName}`}
                      </p>
                    </div>
                    <Badge variant="outline">{event.type.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Priority tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentTasks.length === 0 ? (
              <EmptyState icon={ListChecks} title="You're all caught up" description="No pending tasks right now." />
            ) : (
              <ul className="flex flex-col gap-3">
                {stats.recentTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.client?.fullName ?? task.case?.title ?? "General"}
                        {task.dueAt && ` · Due ${formatDateTime(task.dueAt)}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        task.priority === "URGENT"
                          ? "destructive"
                          : task.priority === "HIGH"
                            ? "gold"
                            : "outline"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
