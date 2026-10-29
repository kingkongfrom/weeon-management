import { describe, expect, it } from "vitest";

import { summarizeNavTimings } from "@/lib/observability/nav-timings";

const row = (over: Partial<Parameters<typeof summarizeNavTimings>[0][number]> = {}) => ({
  surface: "teachers",
  route: "/aula-virtual/[classId]",
  kind: "subject",
  phase: "content",
  samples: 10,
  sum_ms: 400,
  max_ms: 120,
  p50_ms: 40,
  p90_ms: 80,
  ...over,
});

describe("summarizeNavTimings", () => {
  it("folds hourly buckets into one series per route and kind", () => {
    const series = summarizeNavTimings([
      row(),
      row({ samples: 30, sum_ms: 600, max_ms: 90, p50_ms: 20, p90_ms: 30 }),
      row({ phase: "active", samples: 40, sum_ms: 400, max_ms: 20, p50_ms: 10, p90_ms: 12 }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0]?.samples).toBe(80);
    expect(series[0]?.phases.map((phase) => phase.phase)).toEqual(["active", "content"]);
  });

  it("weights the average by samples, not by bucket count", () => {
    const series = summarizeNavTimings([
      row({ samples: 10, sum_ms: 1000 }), // avg 100
      row({ samples: 90, sum_ms: 900 }), // avg 10
    ]);
    // (1000 + 900) / 100 = 19, not the unweighted 55.
    expect(series[0]?.phases[0]?.avgMs).toBe(19);
  });

  it("keeps the worst max and ranks by worst p90", () => {
    const series = summarizeNavTimings([
      row({ max_ms: 120 }),
      row({ max_ms: 400 }),
      row({ route: "/inicio", kind: "tab", p90_ms: 300 }),
    ]);
    expect(series[0]?.route).toBe("/inicio");
    const classwork = series.find((item) => item.route === "/aula-virtual/[classId]");
    expect(classwork?.phases[0]?.maxMs).toBe(400);
    expect(classwork?.worstP90Ms).toBe(80);
  });

  it("ignores unknown phases instead of inventing a column", () => {
    const series = summarizeNavTimings([row({ phase: "paint" })]);
    expect(series).toHaveLength(0);
  });

  it("separates surfaces so another app can post to the same table", () => {
    const series = summarizeNavTimings([row(), row({ surface: "mobile" })]);
    expect(series.map((item) => item.surface).sort()).toEqual(["mobile", "teachers"]);
  });
});
