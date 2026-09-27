const display = new Intl.DisplayNames(["en"], { type: "region" });

export function countryLabel(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "Unknown";
  try {
    return display.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Show province/region from Vercel-style codes (e.g. CR-SJ → SJ). */
export function regionLabel(regionCode: string | null | undefined): string {
  if (!regionCode) return "Unknown region";
  const parts = regionCode.split("-");
  const tail = parts.length > 1 ? parts.slice(1).join("-") : regionCode;
  return tail.replace(/_/g, " ");
}
