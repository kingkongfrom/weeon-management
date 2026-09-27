const display = new Intl.DisplayNames(["en"], { type: "region" });

export function countryLabel(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "Unknown";
  try {
    return display.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * ISO 3166-2 first-level subdivision names, keyed by `<country>-<code>`.
 *
 * Vercel sends the subdivision code in `x-vercel-ip-country-region` (e.g. `H`
 * for Costa Rica's Heredia), so a bare `H`/`C` is meaningless to a reader
 * without this lookup. Costa Rica is Weeon's home market, so all seven provinces
 * are mapped; other countries fall back to the raw code rather than inventing
 * names.
 *
 * Source: ISO 3166-2 (see https://en.wikipedia.org/wiki/ISO_3166-2:CR).
 * Codes can be one OR two characters (`SJ` = San José), and some countries use
 * digits (Vercel's example: Japan → `13`), so matching is by whole code.
 */
const SUBDIVISION_NAMES: Record<string, string> = {
  "CR-A": "Alajuela",
  "CR-C": "Cartago",
  "CR-G": "Guanacaste",
  "CR-H": "Heredia",
  "CR-L": "Limón",
  "CR-P": "Puntarenas",
  "CR-SJ": "San José",
};

/**
 * Human name for a Vercel-style region code.
 *
 * Accepts either form the app produces: `CR-H` (dev override) or a bare `H`
 * (the live header). Resolution order:
 *   1. `<country>-<code>` in the subdivision table,
 *   2. `<code>` looked up against every mapped country (bare-code case),
 *   3. the raw code as-is, so an unmapped region still renders something.
 */
export function regionLabel(
  regionCode: string | null | undefined,
  countryCode?: string | null,
): string {
  if (!regionCode) return "Unknown region";

  const code = regionCode.trim();
  if (!code) return "Unknown region";

  const upper = code.toUpperCase();

  // The code may already carry its country prefix (`CR-H`, from the dev
  // override) or be bare (`H`, the live Vercel header). Normalise to a full
  // `CC-X` key when possible so both forms resolve the same way.
  const compound = /^[A-Z]{2}-/.test(upper);
  const bare = compound ? upper.split("-").slice(1).join("-") : upper;
  const country = compound
    ? upper.slice(0, 2)
    : (countryCode?.trim().toUpperCase() ?? null);

  if (country) {
    const named = SUBDIVISION_NAMES[`${country}-${bare}`];
    if (named) return named;
  }

  // No country to pair with: match the subdivision suffix across all mappings.
  const suffixMatch = Object.entries(SUBDIVISION_NAMES).find(
    ([key]) => key.split("-").slice(1).join("-") === bare,
  );
  if (suffixMatch) return suffixMatch[1];

  // Unknown region: show the code without its country prefix.
  return bare.replace(/_/g, " ");
}
