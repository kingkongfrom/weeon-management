"use client";

import { CalendarDays } from "lucide-react";

import type { StripMeeting } from "@/lib/calendar/week-strip";
import { JoinMeeting } from "@/components/dashboard/join-meeting";

const BRAND_NUMBER = {
  backgroundImage: "linear-gradient(100deg, #5e25cc 0%, #2b59ff 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

/**
 * Five-day strip under the Ops day band, mirroring the school ERP's Resumen
 * week strip: weekday name, big day number (brand gradient for today), up to
 * two meeting titles and the first start time.
 *
 * Meetings come from `demo_meetings`, the Ops mirror of Cal.com bookings, so
 * this renders even when Cal.com is unreachable.
 */
export function OpsWeekStrip({
  days,
  todayISO,
  locale,
  snapshot,
  now,
}: {
  days: { iso: string; meetings: StripMeeting[] }[];
  todayISO: string;
  locale: string;
  snapshot: { configured: boolean; reason?: string };
  /** Server `now`, so hydration agrees with the first paint. */
  now: string;
}) {
  const lang = locale === "en" ? "en-US" : "es-CR";

  const weekday = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(lang, { weekday: "long" });
  };

  return (
    <section className="border-t border-border pt-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/45">
          Reuniones de la semana
        </h2>
        {snapshot.configured ? null : (
          <p className="text-[11px] font-medium text-foreground/40">{snapshot.reason}</p>
        )}
      </div>

      <ol className="grid grid-cols-5 gap-2 sm:gap-3">
        {days.map((day) => {
          const isToday = day.iso === todayISO;
          const titles = day.meetings.slice(0, 2).map((meeting) => meeting.title);
          const first = day.meetings[0];
          return (
            <li key={day.iso} className="flex">
              <div className="flex h-full w-full flex-col rounded-xl border-[#9ec5eb] bg-surface px-1.5 py-2 dark:border-border">
                <p className="text-sm font-medium capitalize text-foreground/65 dark:text-foreground/50">
                  {weekday(day.iso)}
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold tabular-nums leading-none sm:text-3xl ${
                    isToday ? "" : "text-foreground/80 dark:text-foreground/70"
                  }`}
                  style={isToday ? BRAND_NUMBER : undefined}
                >
                  {Number(day.iso.slice(-2))}
                </p>
                {titles.length > 0 ? (
                  <ul className="mt-2 space-y-0.5">
                    {titles.map((title, index) => {
                      const meeting = day.meetings[index];
                      return (
                        <li
                          key={`${day.iso}-${index}`}
                          className="line-clamp-2 text-[11px] leading-snug text-foreground/60 sm:text-xs dark:text-foreground/45"
                        >
                          {meeting?.pending ? (
                            <span
                              className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#eab308] align-middle"
                              title="Pendiente de confirmar"
                            />
                          ) : null}
                          {title}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <span className="mt-2 block h-4 sm:h-5" aria-hidden />
                )}
                {first ? (
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-1 pt-1.5">
                    <span className="text-[11px] font-semibold tabular-nums text-foreground/45">
                      {first.startTime}
                    </span>
                    <JoinMeeting meeting={first} now={now} variant="inline" />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {snapshot.reason ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-warning">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {snapshot.reason}
        </p>
      ) : null}
    </section>
  );
}
