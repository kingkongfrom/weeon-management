/**
 * Week window for the Ops strip and any other Monday-first view.
 *
 * Pure and client-safe (no DB, no `server-only`), so tests and client
 * components can use it. Dates are handled as civil `YYYY-MM-DD` strings.
 */

export function weekWindow(todayISO: string): string[] {
  const [y, m, d] = todayISO.split("-").map(Number);
  const today = new Date(y, (m ?? 1) - 1, d ?? 1);
  const offset = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);

  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate(),
    ).padStart(2, "0")}`;
  });
}

export function meetingsByWeekday<T extends { date: string }>(
  meetings: T[],
  todayISO: string,
): { iso: string; meetings: T[] }[] {
  return weekWindow(todayISO).map((iso) => ({
    iso,
    meetings: meetings.filter((meeting) => meeting.date === iso),
  }));
}
