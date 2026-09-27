const display = new Intl.DisplayNames(["en"], { type: "region" });

export function countryLabel(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "Unknown";
  try {
    return display.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
