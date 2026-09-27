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
 * Minimum polygon area (in squared degrees) for a country to be labelled.
 *
 * Tiny islands are geometrically minuscule at the LATAM/World framing, so their
 * names collide and add noise without signal. Filtering by an explicit name list
 * proved hopeless — every pass missed more islands (Curaçao, Montserrat, Cayman,
 * Turks and Caicos, Bermuda, Aruba, the Virgin Islands, the Pacific territories
 * …). A size threshold catches them all, including ones the dataset mislabels,
 * and never needs updating when the boundary data changes.
 *
 * In this dataset there is a clean natural gap: islands top out at ~0.94 and the
 * smallest labelled mainland country (El Salvador) is 1.68. 1.2 sits in the void.
 *
 * SIZE ONLY HIDES THE NAME. Islands still render with fill and border and still
 * respond to clicks — a small territory with visits stays visible in the
 * choropleth, it just has no text.
 */
export const MAP_LABEL_MIN_AREA = 1.2;

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
