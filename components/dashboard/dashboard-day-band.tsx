"use client";

import { DashboardWeather } from "@/components/dashboard/dashboard-weather";
import { LiveClock } from "@/components/dashboard/live-clock";
import type { WeatherSnapshot } from "@/lib/weather/met-norway";

const SCHOOL_TZ = "America/Costa_Rica";

const BRAND_NUMBER = {
  backgroundImage: "linear-gradient(100deg, #5e25cc 0%, #2b59ff 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

/** School-local calendar date in Costa Rica, as `YYYY-MM-DD`. */
function schoolTodayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function dateParts(
  iso: string,
  lang: string,
): { weekday: string; day: string; month: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return {
    weekday: date.toLocaleDateString(lang, { weekday: "long" }),
    day: String(date.getDate()),
    month: `${date.toLocaleDateString(lang, { month: "long" })} ${date.getFullYear()}`,
  };
}

/**
 * Date + clock + live weather, upper-left of the Ops dashboard. Same reading as
 * the school ERP's Resumen morning sheet, with the brand gradient on the day
 * number so it matches the rest of the console. `todayISO` comes from the page
 * (Costa Rica civil date) so the band and the week strip cannot disagree.
 */
export function DashboardDayBand({
  weather,
  locale,
  todayISO,
}: {
  weather: WeatherSnapshot | null;
  locale: string;
  todayISO?: string;
}) {
  const lang = locale === "en" ? "en-US" : "es-CR";
  const parts = dateParts(todayISO ?? schoolTodayISO(), lang);

  return (
    <header className="flex flex-col">
      <p className="text-sm font-medium capitalize tracking-wide text-foreground/60">
        {parts.weekday}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p
          className="brand-page-title text-[4rem] leading-none tracking-tight"
          style={BRAND_NUMBER}
        >
          {parts.day}
        </p>
        {weather ? <DashboardWeather weather={weather} /> : null}
      </div>
      <p className="mt-1 text-xl capitalize text-foreground/70">{parts.month}</p>
      <LiveClock locale={locale} className="mt-1 text-sm font-semibold tabular-nums tracking-wide text-foreground/55" />
    </header>
  );
}
