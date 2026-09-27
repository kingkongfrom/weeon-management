/** ISO 3166-1 alpha-2 — Latin America & Caribbean (Weeon focus). */
export const LATAM_COUNTRY_CODES = new Set([
  "AR",
  "BO",
  "BR",
  "BZ",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "GT",
  "GY",
  "HN",
  "HT",
  "JM",
  "MX",
  "NI",
  "PA",
  "PE",
  "PR",
  "PY",
  "SR",
  "SV",
  "TT",
  "UY",
  "VE",
]);

export type MapRegionPreset = "latam" | "world";

/**
 * Small island states whose names are suppressed on the map.
 *
 * They are geographically tiny, so on the LATAM/World framing their labels
 * collide, sit on top of each other, and add noise without useful signal. The
 * countries still render (fill + border) and still take clicks; only the *name*
 * is hidden. Weeon's visitors concentrate in the mainland markets.
 */
export const MAP_LABEL_EXCLUDED_CODES = new Set([
  "AG", // Antigua and Barbuda
  "BB", // Barbados
  "BS", // The Bahamas
  "CU", // Cuba
  "DM", // Dominica
  "DO", // Dominican Republic
  "GD", // Grenada
  "HT", // Haiti
  "JM", // Jamaica
  "KN", // Saint Kitts and Nevis
  "LC", // Saint Lucia
  "PR", // Puerto Rico
  "TT", // Trinidad and Tobago
  "VC", // Saint Vincent and the Grenadines
]);

/**
 * Islands whose features carry a broken/missing ISO code (`-99` in the bundled
 * dataset), so they cannot be filtered by code. Matched case-insensitively
 * against the rendered label.
 */
export const MAP_LABEL_EXCLUDED_NAMES = new Set([
  "saint martin",
  "sint maarten",
  "us naval base guantanamo bay",
]);

export const MAP_REGION_PRESETS: Array<{ id: MapRegionPreset; label: string }> = [
  { id: "latam", label: "LATAM" },
  { id: "world", label: "World" },
];

export type MapView = {
  center: [number, number];
  zoom: number;
  bearing: number;
  /** When set, the map fits this [[west, south], [east, north]] box. */
  bounds?: [[number, number], [number, number]];
};

/** Approximate center / zoom / bearing for the map views (north up). */
export const MAP_VIEW: Record<MapRegionPreset, MapView> = {
  latam: {
    center: [-74, -15],
    zoom: 2.1,
    bearing: 0,
    bounds: [
      [-119, -57],
      [-34, 34],
    ],
  },
  world: { center: [0, 20], zoom: 1, bearing: 0 },
};
