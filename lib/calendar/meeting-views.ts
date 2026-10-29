/**
 * Pure calendar math for the Ops meetings page.
 *
 * Everything works on Costa Rica civil dates (`YYYY-MM-DD`) because that is
 * what `demo_meetings.meeting_date` stores and what Ops reads out loud on the
 * phone ("el martes a las 10"). Weeks are Monday-first, like the ERP.
 *
 * Client-safe: the meetings page uses it in the browser, so no DB, no
 * `server-only`, no `Date.now()` inside — callers inject `todayISO` / `nowMs`.
 */

export type CalendarView = "month" | "week" | "agenda";

export const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "agenda"];

export function isCalendarView(value: string | null | undefined): value is CalendarView {
  return value === "month" || value === "week" || value === "agenda";
}

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/* ------------------------------------------------------------------------- */
/* Civil dates                                                               */
/* ------------------------------------------------------------------------- */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function civilDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function civilISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = civilDate(iso);
  date.setDate(date.getDate() + days);
  return civilISO(date);
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(iso: string): number {
  return (civilDate(iso).getDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function monthIndex(iso: string): number {
  return civilDate(iso).getMonth();
}

export function yearOf(iso: string): number {
  return civilDate(iso).getFullYear();
}

/** `YYYY-MM-01` for an ISO date, or a month offset from it. */
export function monthStart(iso: string, offset = 0): string {
  const date = civilDate(iso);
  return civilISO(new Date(date.getFullYear(), date.getMonth() + offset, 1));
}

export function daysInMonth(iso: string): number {
  const date = civilDate(iso);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function monthLabel(iso: string): string {
  const date = civilDate(iso);
  const name = MONTHS[date.getMonth()] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

export function shortMonthLabel(iso: string): string {
  return (MONTHS[civilDate(iso).getMonth()] ?? "").slice(0, 3);
}

export function weekdayLong(iso: string): string {
  return WEEKDAY_LONG[weekdayIndex(iso)] ?? "";
}

/** "Miércoles 29 de octubre". */
export function longDateLabel(iso: string): string {
  const date = civilDate(iso);
  return `${weekdayLong(iso)} ${date.getDate()} de ${MONTHS[date.getMonth()] ?? ""}`;
}

/**
 * A six-week grid (42 cells) that always starts on a Monday, so switching
 * months never shifts the weekday columns.
 */
export function monthGrid(anchorISO: string): string[] {
  const first = monthStart(anchorISO);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function weekDates(anchorISO: string): string[] {
  const monday = startOfWeek(anchorISO);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** "26 oct – 1 nov 2026" — both ends spelled out, so it reads the same every week. */
export function weekLabel(anchorISO: string): string {
  const [monday, sunday] = [startOfWeek(anchorISO), addDays(startOfWeek(anchorISO), 6)];
  const year = yearOf(sunday);
  if (monthIndex(monday) === monthIndex(sunday)) {
    return `${civilDate(monday).getDate()} – ${civilDate(sunday).getDate()} ${shortMonthLabel(sunday)} ${year}`;
  }
  return `${civilDate(monday).getDate()} ${shortMonthLabel(monday)} – ${civilDate(sunday).getDate()} ${shortMonthLabel(sunday)} ${year}`;
}

/* ------------------------------------------------------------------------- */
/* Agenda grouping                                                           */
/* ------------------------------------------------------------------------- */

/** Any meeting-shaped row the agenda can group. */
export type AgendaItem = { id: string; date: string; startsAt: string };

/**
 * Group by Costa Rica date, newest-day-first never happens: the agenda always
 * reads top to bottom in time order, skipping days with nothing on them.
 */
export function groupByDay<T extends { date: string; startsAt: string }>(
  items: T[],
  direction: "asc" | "desc" = "asc",
): { iso: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const list = buckets.get(item.date);
    if (list) list.push(item);
    else buckets.set(item.date, [item]);
  }

  const days = [...buckets.keys()].sort((a, b) => (direction === "asc" ? a.localeCompare(b) : b.localeCompare(a)));
  return days.map((iso) => ({
    iso,
    items: buckets
      .get(iso)!
      .slice()
      .sort((a, b) => (direction === "asc" ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt))),
  }));
}

/* ------------------------------------------------------------------------- */
/* Relative time                                                             */
/* ------------------------------------------------------------------------- */

/** "en 25 min", "en 3 h", "mañana", "en 5 días", "ahora". */
export function untilLabel(startsAt: string, nowMs: number): string {
  const diff = new Date(startsAt).getTime() - nowMs;
  if (Number.isNaN(diff)) return "";
  if (diff <= 60_000) return "ahora";

  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `en ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `en ${hours} h`;

  const days = Math.round(hours / 24);
  return days === 1 ? "mañana" : `en ${days} días`;
}

/**
 * True when two ISO dates fall in the same month. Used to dim the leading and
 * trailing cells of a month grid that belong to the previous/next month.
 */
export function sameMonth(iso: string, anchorISO: string): boolean {
  return iso.slice(0, 7) === anchorISO.slice(0, 7);
}
