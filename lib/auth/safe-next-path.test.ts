import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next-path";

describe("safeNextPath", () => {
  it("keeps internal dashboard paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard/tenants/123")).toBe("/dashboard/tenants/123");
  });

  it("preserves the query string", () => {
    expect(safeNextPath("/dashboard/tenants?status=demo")).toBe(
      "/dashboard/tenants?status=demo",
    );
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("http://evil.com/x")).toBe("/dashboard");
  });

  it("rejects javascript: and non-slash input", () => {
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeNextPath("dashboard")).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("does not redirect back to public auth paths", () => {
    expect(safeNextPath("/")).toBe("/dashboard");
    expect(safeNextPath("/login")).toBe("/dashboard");
    expect(safeNextPath("/reset-password")).toBe("/dashboard");
    expect(safeNextPath("/accept-invite")).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeNextPath("//evil.com", "/login")).toBe("/login");
  });
});
