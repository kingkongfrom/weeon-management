import { describe, expect, it } from "vitest";

import {
  CALENDAR_VIEWS,
  addDays,
  daysInMonth,
  groupByDay,
  isCalendarView,
  longDateLabel,
  monthGrid,
  monthLabel,
  monthStart,
  sameMonth,
  startOfWeek,
  untilLabel,
  weekDates,
  weekLabel,
  weekdayIndex,
} from "@/lib/calendar/meeting-views";

describe("monthGrid", () => {
  it("always returns six Monday-first weeks", () => {
    const grid = monthGrid("2026-10-29");
    expect(grid).toHaveLength(42);
    expect(grid.every((iso) => weekdayIndex(iso) === 0 || weekdayIndex(iso) > 0)).toBe(true);
    expect(weekdayIndex(grid[0])).toBe(0);
    expect(grid).toContain("2026-10-01");
    expect(grid).toContain("2026-10-31");
  });

  it("starts on the Monday on or before the first of the month", () => {
    // 1 Feb 2026 is a Sunday, so the grid opens on 26 Jan.
    expect(monthGrid("2026-02-10")[0]).toBe("2026-01-26");
  });

  it("does not shift weekday columns between months of the same year", () => {
    for (const month of ["2026-03-15", "2026-04-15", "2026-09-15", "2026-12-15"]) {
      const grid = monthGrid(month);
      expect(weekdayIndex(grid[0])).toBe(0);
      expect(weekdayIndex(grid[41])).toBe(6);
    }
  });
});

describe("week helpers", () => {
  it("opens weeks on Monday and closes on Sunday", () => {
    const dates = weekDates("2026-10-29"); // Thursday
    expect(dates[0]).toBe("2026-10-26");
    expect(dates[6]).toBe("2026-11-01");
  });

  it("labels a week across month boundaries", () => {
    expect(weekLabel("2026-10-29")).toBe("26 oct – 1 nov 2026");
    expect(weekLabel("2026-11-10")).toBe("9 – 15 nov 2026");
  });
});

describe("civil date helpers", () => {
  it("rolls across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26");
  });

  it("counts month days", () => {
    expect(daysInMonth("2026-02-01")).toBe(28);
    expect(daysInMonth("2028-02-01")).toBe(29);
    expect(daysInMonth("2026-10-01")).toBe(31);
  });

  it("formats Spanish labels", () => {
    expect(monthLabel("2026-10-29")).toBe("Octubre 2026");
    expect(longDateLabel("2026-10-29")).toBe("Jueves 29 de octubre");
    expect(monthStart("2026-10-29", -1)).toBe("2026-09-01");
    expect(sameMonth("2026-10-01", "2026-10-29")).toBe(true);
    expect(sameMonth("2026-11-01", "2026-10-29")).toBe(false);
  });
});

describe("groupByDay", () => {
  const items = [
    { id: "c", date: "2026-10-30", startsAt: "2026-10-30T18:00:00.000Z" },
    { id: "a", date: "2026-10-29", startsAt: "2026-10-29T14:00:00.000Z" },
    { id: "b", date: "2026-10-29", startsAt: "2026-10-29T16:00:00.000Z" },
  ];

  it("groups in time order and skips empty days", () => {
    const days = groupByDay(items);
    expect(days.map((day) => day.iso)).toEqual(["2026-10-29", "2026-10-30"]);
    expect(days[0].items.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("reverses both day and slot order for history", () => {
    const days = groupByDay(items, "desc");
    expect(days.map((day) => day.iso)).toEqual(["2026-10-30", "2026-10-29"]);
    expect(days[1].items.map((item) => item.id)).toEqual(["b", "a"]);
  });
});

describe("untilLabel", () => {
  const now = new Date("2026-10-29T14:00:00.000Z").getTime();

  it("reads naturally at every scale", () => {
    expect(untilLabel("2026-10-29T14:00:30.000Z", now)).toBe("ahora");
    expect(untilLabel("2026-10-29T14:25:00.000Z", now)).toBe("en 25 min");
    expect(untilLabel("2026-10-29T17:00:00.000Z", now)).toBe("en 3 h");
    expect(untilLabel("2026-10-30T14:00:00.000Z", now)).toBe("mañana");
    expect(untilLabel("2026-11-03T14:00:00.000Z", now)).toBe("en 5 días");
  });
});

describe("view guard", () => {
  it("accepts only known views", () => {
    for (const view of CALENDAR_VIEWS) expect(isCalendarView(view)).toBe(true);
    expect(isCalendarView("year")).toBe(false);
    expect(isCalendarView(null)).toBe(false);
  });
});
