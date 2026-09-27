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
