import { Suspense } from "react";
import { DashboardDayBand } from "@/components/dashboard/dashboard-day-band";
import { OpsWeekStrip } from "@/components/dashboard/ops-week-strip";
import { Skeleton } from "@/components/dashboard/skeleton";
import { meetingsByWeekday } from "@/lib/calendar/week-window";
import { loadWeekStrip } from "@/lib/calendar/week-strip";
import { WEEON_OPS_TIME_ZONE } from "@/lib/datetime/costa-rica";
import { getLocale } from "@/lib/i18n/server";
import { loadOpsWeather } from "@/lib/weather/load-ops-weather";

/** Today in Costa Rica civil time, as `YYYY-MM-DD`. */
function opsTodayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WEEON_OPS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

async function DayContent() {
  const todayISO = opsTodayISO();
  // One `now` for the whole render: the join windows on the strip and the
  // table must agree, and the client must hydrate to the same value.
  const now = new Date().toISOString();
  const [weather, strip, locale] = await Promise.all([
    loadOpsWeather(),
    loadWeekStrip(todayISO),
    getLocale(),
  ]);

  return (
    <>
      <DashboardDayBand weather={weather} locale={locale} todayISO={todayISO} />
      <OpsWeekStrip
        days={meetingsByWeekday(strip.meetings, todayISO)}
        todayISO={todayISO}
        locale={locale}
        snapshot={strip}
        now={now}
      />
    </>
  );
}

function DaySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-16 w-40" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Ops landing dashboard: date, clock and weather top-left, then the week's
 * demo meetings (mirrored from Cal.com into `demo_meetings`). More cards land
 * here as the panel grows. Anything added must read across tenants through the
 * platform client only.
 */
export default function DashboardHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Suspense fallback={<DaySkeleton />}>
        <DayContent />
      </Suspense>
    </div>
  );
}
