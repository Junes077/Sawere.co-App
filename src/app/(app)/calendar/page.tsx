import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { requireUser } from "@/lib/auth";
import { listEventsInRange } from "@/lib/data/calendar";
import { listClients } from "@/lib/data/clients";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventFormDialog } from "@/components/calendar/event-form-dialog";
import { Button } from "@/components/ui/button";
import { getDictionary, getUserLocale } from "@/lib/i18n";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { month } = await searchParams;
  const dict = getDictionary(getUserLocale(user.preferences));

  const anchor = month ? new Date(`${month}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [events, clients, cases] = await Promise.all([
    listEventsInRange(user.firmId, gridStart, gridEnd),
    listClients(user.firmId),
    prisma.case.findMany({ where: { firmId: user.firmId }, orderBy: { createdAt: "desc" } }),
  ]);

  const eventsByDay = new Map<string, typeof events>();
  for (const event of events) {
    const key = new Date(event.startsAt).toISOString().slice(0, 10);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event]);
  }

  const prevMonth = subMonths(monthStart, 1).toISOString().slice(0, 7);
  const nextMonth = addMonths(monthStart, 1).toISOString().slice(0, 7);
  const monthLabel = monthStart.toLocaleString("en-TZ", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader
        title={dict.pages.calendar.title}
        description={dict.pages.calendar.description}
        actions={<EventFormDialog clients={clients} cases={cases} />}
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-foreground">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={{ pathname: "/calendar", query: { month: prevMonth } }} aria-label="Previous month">
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={{ pathname: "/calendar", query: { month: nextMonth } }} aria-label="Next month">
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <CalendarGrid
        days={days}
        eventsByDay={eventsByDay}
        currentMonth={monthStart.getMonth()}
        today={new Date().toISOString().slice(0, 10)}
        clients={clients}
        cases={cases}
      />
    </div>
  );
}
