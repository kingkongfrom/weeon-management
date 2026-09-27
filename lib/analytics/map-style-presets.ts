/**
 * Cartographic presets for the marketing visitors choropleth.
 *
 * These are deliberately restrained, professional styles: neutral oceans,
 * off-white land, hairline borders and muted single-hue data ramps so the
 * country labels stay legible. Every preset ships a `light` and a `dark`
 * theme; the map reads nothing else, so adding or retuning a preset is a
 * one-stop change.
 *
 * Ramp stops are normalized 0..1 (first must be 0, last must be 1) and scale to
 * the busiest country for the selected range.
 */
export type MapStylePresetId =
  | "slate"
  | "mist"
  | "sand"
  | "ink"
  | "graphite";

export type MapStyleTheme = {
  /** Canvas behind every land mass. */
  ocean: string;
  /** Countries with no recorded views. */
  empty: string;
  /** Countries clipped out of the active region. */
  dimmed: string;
  /** Choropleth ramp, normalized 0..1 (first stop 0, last stop 1). */
  ramp: ReadonlyArray<{ at: number; color: string }>;
  border: string;
  borderWidth: number;
  borderDash?: [number, number];
  /** Outline of the selected country — usually the same hue as `selectedFill`. */
  selected: string;
  selectedWidth: number;
  /**
   * Interior wash for the selected country. Deliberately low-alpha so the
   * choropleth underneath still reads; the outline carries the emphasis. Keep
   * this the same hue as `selected` so the selected country looks like one
   * object rather than a tinted fill with a mismatched border.
   */
  selectedFill: string;
  fillOpacity: number;
  dimmedOpacity: number;
  /** Country name label text. */
  label: string;
  /** Halo behind the label for legibility over any fill. */
  labelHalo: string;
  labelOpacity: number;
};

export type MapStylePreset = {
  id: MapStylePresetId;
  label: string;
  hint: string;
  light: MapStyleTheme;
  dark: MapStyleTheme;
};

export const MAP_STYLE_PRESETS: readonly MapStylePreset[] = [
  {
    id: "slate",
    label: "Slate",
    hint: "Cool gray cartography with a muted steel-blue data ramp.",
    light: {
      ocean: "#dfe4ea",
      empty: "#ffffff",
      dimmed: "#eceff2",
      ramp: [
        { at: 0, color: "#e2eaf3" },
        { at: 0.5, color: "#8aa4c4" },
        { at: 1, color: "#315d92" },
      ],
      border: "rgba(138, 148, 160, 0.55)",
      borderWidth: 0.55,
      selected: "#1f6feb",
      selectedWidth: 1.7,
      selectedFill: "rgba(31, 111, 235, 0.22)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.4,
      label: "#5c6775",
      labelHalo: "#ffffff",
      labelOpacity: 1,
    },
    dark: {
      ocean: "#191d24",
      empty: "#242931",
      dimmed: "#1f232a",
      ramp: [
        { at: 0, color: "#2b3542" },
        { at: 0.5, color: "#5c7ba3" },
        { at: 1, color: "#a3c2e6" },
      ],
      border: "rgba(255, 255, 255, 0.12)",
      borderWidth: 0.55,
      selected: "#7db0ff",
      selectedWidth: 1.7,
      selectedFill: "rgba(125, 176, 255, 0.26)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.45,
      label: "#9aa5b4",
      labelHalo: "#11151b",
      labelOpacity: 1,
    },
  },
  {
    id: "mist",
    label: "Mist",
    hint: "Airy near-monochrome blue-gray with a soft teal ramp.",
    light: {
      ocean: "#e9edef",
      empty: "#fcfdfd",
      dimmed: "#eef1f2",
      ramp: [
        { at: 0, color: "#dfe9e6" },
        { at: 0.5, color: "#8fb3ab" },
        { at: 1, color: "#3d7a6d" },
      ],
      border: "rgba(140, 150, 152, 0.45)",
      borderWidth: 0.5,
      selected: "#2b6cb0",
      selectedWidth: 1.6,
      selectedFill: "rgba(43, 108, 176, 0.22)",
      fillOpacity: 0.88,
      dimmedOpacity: 0.4,
      label: "#66727a",
      labelHalo: "#ffffff",
      labelOpacity: 1,
    },
    dark: {
      ocean: "#181c1d",
      empty: "#232828",
      dimmed: "#1e2223",
      ramp: [
        { at: 0, color: "#2a3433" },
        { at: 0.5, color: "#5f8a80" },
        { at: 1, color: "#9ed0c4" },
      ],
      border: "rgba(255, 255, 255, 0.11)",
      borderWidth: 0.5,
      selected: "#63b3ed",
      selectedWidth: 1.6,
      selectedFill: "rgba(99, 179, 237, 0.26)",
      fillOpacity: 0.88,
      dimmedOpacity: 0.45,
      label: "#96a1a3",
      labelHalo: "#101414",
      labelOpacity: 1,
    },
  },
  {
    id: "sand",
    label: "Sand",
    hint: "Warm paper tones with a muted terracotta data ramp.",
    light: {
      ocean: "#e9e3d9",
      empty: "#fbf8f3",
      dimmed: "#f0e9de",
      ramp: [
        { at: 0, color: "#efe2ce" },
        { at: 0.5, color: "#c99a63" },
        { at: 1, color: "#8a5a2b" },
      ],
      border: "rgba(150, 136, 116, 0.5)",
      borderWidth: 0.5,
      selected: "#a15c1f",
      selectedWidth: 1.6,
      selectedFill: "rgba(161, 92, 31, 0.22)",
      fillOpacity: 0.88,
      dimmedOpacity: 0.4,
      label: "#6f6256",
      labelHalo: "#fdfaf5",
      labelOpacity: 1,
    },
    dark: {
      ocean: "#1e1a16",
      empty: "#2a2520",
      dimmed: "#241f1a",
      ramp: [
        { at: 0, color: "#33291f" },
        { at: 0.5, color: "#9a6c3c" },
        { at: 1, color: "#e0b483" },
      ],
      border: "rgba(255, 255, 255, 0.11)",
      borderWidth: 0.5,
      selected: "#e6a15f",
      selectedWidth: 1.6,
      selectedFill: "rgba(230, 161, 95, 0.26)",
      fillOpacity: 0.88,
      dimmedOpacity: 0.45,
      label: "#a99a88",
      labelHalo: "#15110d",
      labelOpacity: 1,
    },
  },
  {
    id: "ink",
    label: "Ink",
    hint: "Dark slate cartography with a soft blue data ramp.",
    light: {
      ocean: "#e4e7ec",
      empty: "#ffffff",
      dimmed: "#eef0f3",
      ramp: [
        { at: 0, color: "#dbe4f0" },
        { at: 0.5, color: "#7d9cc4" },
        { at: 1, color: "#2c5282" },
      ],
      // Lighter border colour at a hairline width: a soft edge reads as thin
      // without disappearing, and stops the outlines fighting the choropleth.
      border: "rgba(140, 150, 162, 0.28)",
      borderWidth: 0.2,
      selected: "#0f766e",
      selectedWidth: 1.2,
      selectedFill: "rgba(15, 118, 110, 0.16)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.4,
      label: "#000000",
      labelHalo: "#ffffff",
      labelOpacity: 1,
    },
    dark: {
      ocean: "#0f1319",
      empty: "#1b212b",
      dimmed: "#161b22",
      ramp: [
        { at: 0, color: "#1f2a3a" },
        { at: 0.5, color: "#3f6ba0" },
        { at: 1, color: "#8fbce8" },
      ],
      // Softer white so the hairlines read as thin on the dark canvas.
      border: "rgba(255, 255, 255, 0.07)",
      borderWidth: 0.2,
      selected: "#5eead4",
      selectedWidth: 1.2,
      selectedFill: "rgba(94, 234, 212, 0.18)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.45,
      label: "#ffffff",
      labelHalo: "#0a0e13",
      labelOpacity: 1,
    },
  },
  {
    id: "graphite",
    label: "Graphite",
    hint: "Monochrome dark atlas with a neutral gray ramp.",
    light: {
      ocean: "#e6e7e9",
      empty: "#fbfbfc",
      dimmed: "#eef0f1",
      ramp: [
        { at: 0, color: "#e0e2e5" },
        { at: 0.5, color: "#9aa1ab" },
        { at: 1, color: "#414852" },
      ],
      border: "rgba(135, 142, 152, 0.5)",
      borderWidth: 0.5,
      selected: "#334155",
      selectedWidth: 1.6,
      selectedFill: "rgba(51, 65, 85, 0.24)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.4,
      label: "#606874",
      labelHalo: "#ffffff",
      labelOpacity: 1,
    },
    dark: {
      ocean: "#15171a",
      empty: "#22252a",
      dimmed: "#1c1f23",
      ramp: [
        { at: 0, color: "#2a2e34" },
        { at: 0.5, color: "#6b7480" },
        { at: 1, color: "#ccd4dd" },
      ],
      border: "rgba(255, 255, 255, 0.1)",
      borderWidth: 0.5,
      selected: "#e2e8f0",
      selectedWidth: 1.6,
      selectedFill: "rgba(226, 232, 240, 0.24)",
      fillOpacity: 0.9,
      dimmedOpacity: 0.45,
      label: "#8d97a3",
      labelHalo: "#0d0f12",
      labelOpacity: 1,
    },
  },
];

export const DEFAULT_MAP_STYLE_PRESET: MapStylePresetId = "ink";

export function getMapStylePreset(
  presetId: MapStylePresetId | null | undefined,
): MapStylePreset {
  return (
    MAP_STYLE_PRESETS.find((item) => item.id === presetId) ??
    MAP_STYLE_PRESETS[0]
  );
}

export function getMapStyleTheme(
  presetId: MapStylePresetId,
  mode: "light" | "dark",
): MapStyleTheme {
  return getMapStylePreset(presetId)[mode];
}

/**
 * MapLibre `fill-color` expression built from a preset ramp. Returns a plain
 * `unknown[]` because the GL expression grammar is not fully typed in this
 * maplibre glossary version.
 */
export function buildFillColorExpression(
  maxViews: number,
  theme: MapStyleTheme,
): unknown[] {
  const strongest = theme.ramp[theme.ramp.length - 1]?.color ?? theme.empty;

  if (maxViews <= 0) {
    return ["case", ["get", "dimmed"], theme.dimmed, theme.empty];
  }

  if (maxViews === 1) {
    return [
      "case",
      ["get", "dimmed"],
      theme.dimmed,
      [">", ["coalesce", ["get", "views"], 0], 0],
      strongest,
      theme.empty,
    ];
  }

  const stops: unknown[] = [];
  for (const stop of theme.ramp) {
    stops.push(stop.at * maxViews, stop.color);
  }

  return [
    "case",
    ["get", "dimmed"],
    theme.dimmed,
    [">", ["coalesce", ["get", "views"], 0], 0],
    ["interpolate", ["linear"], ["coalesce", ["get", "views"], 0], ...stops],
    theme.empty,
  ];
}
