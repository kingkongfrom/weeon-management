import { Suspense } from "react";
import { MeetingsCalendar } from "@/components/dashboard/meetings-calendar";
import { Skeleton } from "@/components/dashboard/skeleton";
import { loadDemoMeetings } from "@/lib/calendar/demo-meetings-store";
import { isCalendarView } from "@/lib/calendar/meeting-views";
import { WEEON_OPS_TIME_ZONE } from "@/lib/datetime/costa-rica";

export const dynamic = "force-dynamic";

function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WEEON_OPS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** Twelve months back (history, outcomes) and four ahead (recorded bookings). */
function windowDates(): { from: string; to: string } {
  const base = new Date(`${todayISO()}T12:00:00Z`);
  const iso = (days: number) => {
    const d = new Date(base);
    d.setDate(base.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return { from: iso(-365), to: iso(120) };
}

async function MeetingsContent({
  view,
  meetingId,
}: {
  view?: string;
  meetingId?: string;
}) {
  const { from, to } = windowDates();
  // One clock for every join window and "past/upcoming" decision in this render.
  const now = new Date().toISOString();
  const { meetings, reason } = await loadDemoMeetings({ from, to, limit: 1000 });

  if (reason) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="brand-page-title text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Reuniones
        </h1>
        <p className="rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm font-medium text-warning">
          {reason}
        </p>
      </div>
    );
  }

  return (
    <MeetingsCalendar
      meetings={meetings}
      now={now}
      todayISO={todayISO()}
      initialView={isCalendarView(view) ? view : "month"}
      initialState={meetingId ?? null}
    />
  );
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; m?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-hidden>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-[32rem] rounded-2xl" />
          </div>
        }
      >
        <MeetingsContent view={params.view} meetingId={params.m} />
      </Suspense>
    </div>
  );
}
