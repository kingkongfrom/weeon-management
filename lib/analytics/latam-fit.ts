/**
 * Web-Mercator "fit bounds" math shared by the live map and the generated
 * loading silhouette, so the two use an identical camera window.
 *
 * Mirrors MapLibre's projection: world size = TILE * 2^zoom with TILE = 512.
 */
const TILE = 512;

export type LonLatBounds = [[number, number], [number, number]];

function lonToX(lon: number, worldSize: number): number {
  return ((lon + 180) / 360) * worldSize;
}

function latToY(lat: number, worldSize: number): number {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize;
}

function xToLon(x: number, worldSize: number): number {
  return (x / worldSize) * 360 - 180;
}

function yToLat(y: number, worldSize: number): number {
  const n = Math.PI * (1 - (2 * y) / worldSize);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

export type FitView = {
  center: [number, number];
  zoom: number;
};

/** Center/zoom that fits `bounds` inside a `width` x `height` viewport. */
export function fitViewForBounds(
  bounds: LonLatBounds,
  width: number,
  height: number,
): FitView {
  const world = TILE;
  const x0 = lonToX(bounds[0][0], world);
  const x1 = lonToX(bounds[1][0], world);
  const y0 = latToY(bounds[1][1], world);
  const y1 = latToY(bounds[0][1], world);
  const boxW = x1 - x0;
  const boxH = y1 - y0;
  const zoom = Math.min(
    Math.log2(width / boxW),
    Math.log2(height / boxH),
  );
  return {
    center: [xToLon((x0 + x1) / 2, world), yToLat((y0 + y1) / 2, world)],
    zoom,
  };
}
