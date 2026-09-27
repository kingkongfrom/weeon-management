"use client";

/**
 * Trim the padded/white border off a school logo for tight circular display.
 *
 * School logos are stored via `weeon-tenants` `centerLogoImage`, which
 * intentionally keeps a white rim + margin so the mark sits nicely inside the
 * ERP's square frame. In the Ops console we want the opposite: the mark should
 * fill a circle with no visible white ring, so this crops to the content
 * bounding box (with only a hair of breathing room) and re-centers in a square.
 *
 * Mirrors the ERP algorithm (`weeon-tenants/lib/dashboard/logo-image.ts`) but
 * with a negative/zero margin instead of padding.
 */

const ALPHA_THRESHOLD = 16;
const COLOR_TOLERANCE = 42;
/** Extra crop inward (fraction of content span) to remove a residual rim. */
const CROP_IN_RATIO = 0.06;
/** Tiny transparent breathing room so the circle clip does not shave edges. */
const MARGIN_RATIO = 0.03;

type RGB = { r: number; g: number; b: number };

function colorDistance(px: Uint8ClampedArray, index: number, rgb: RGB): number {
  const dr = px[index] - rgb.r;
  const dg = px[index + 1] - rgb.g;
  const db = px[index + 2] - rgb.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function borderBackground(
  px: Uint8ClampedArray,
  width: number,
  height: number,
): RGB | null {
  const buckets = new Map<string, { count: number; sum: RGB }>();
  let border = 0;

  const sample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    if (px[index + 3] <= ALPHA_THRESHOLD) return;
    border += 1;
    const key = `${px[index] >> 4}-${px[index + 1] >> 4}-${px[index + 2] >> 4}`;
    const bucket = buckets.get(key) ?? { count: 0, sum: { r: 0, g: 0, b: 0 } };
    bucket.count += 1;
    bucket.sum.r += px[index];
    bucket.sum.g += px[index + 1];
    bucket.sum.b += px[index + 2];
    buckets.set(key, bucket);
  };

  for (let x = 0; x < width; x += 1) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    sample(0, y);
    sample(width - 1, y);
  }

  if (border === 0) return null;

  let best: { count: number; sum: RGB } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best || best.count / border < 0.5) return null;

  return {
    r: Math.round(best.sum.r / best.count),
    g: Math.round(best.sum.g / best.count),
    b: Math.round(best.sum.b / best.count),
  };
}

function isBackground(
  px: Uint8ClampedArray,
  index: number,
  background: RGB | null,
): boolean {
  if (px[index + 3] <= ALPHA_THRESHOLD) return true;
  if (!background) return false;
  return colorDistance(px, index, background) < COLOR_TOLERANCE;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to the <img> path
    }
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

/**
 * Crop a logo to its content bounding box and re-center in a square PNG.
 * Falls back to the original file when anything goes wrong.
 */
export async function trimLogoImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await loadBitmap(file);
    if (!bitmap) return file;

    const width = "width" in bitmap ? bitmap.width : 0;
    const height = "height" in bitmap ? bitmap.height : 0;
    if (!width || !height) return file;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    const { data: px } = ctx.getImageData(0, 0, width, height);

    const background = borderBackground(px, width, height);

    const rowEmpty = new Array<boolean>(height).fill(true);
    const colEmpty = new Array<boolean>(width).fill(true);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        if (isBackground(px, index, background)) continue;
        rowEmpty[y] = false;
        colEmpty[x] = false;
      }
    }

    let minX = 0;
    while (minX < width && colEmpty[minX]) minX += 1;
    let maxX = width - 1;
    while (maxX >= 0 && colEmpty[maxX]) maxX -= 1;
    let minY = 0;
    while (minY < height && rowEmpty[minY]) minY += 1;
    let maxY = height - 1;
    while (maxY >= 0 && rowEmpty[maxY]) maxY -= 1;

    if (maxX < minX || maxY < minY) return file;

    // Crop slightly inward so a residual white rim from the stored logo is
    // removed rather than shown as a ring inside the circle.
    const contentSpan = Math.max(maxX - minX + 1, maxY - minY + 1);
    const inward = Math.round(contentSpan * CROP_IN_RATIO);
    minX = Math.min(width - 1, minX + inward);
    minY = Math.min(height - 1, minY + inward);
    maxX = Math.max(0, maxX - inward);
    maxY = Math.max(0, maxY - inward);

    const contentWidth = Math.max(1, maxX - minX + 1);
    const contentHeight = Math.max(1, maxY - minY + 1);
    const size = Math.max(contentWidth, contentHeight);
    const margin = Math.round(size * MARGIN_RATIO);
    const output = size + margin * 2;

    const square = document.createElement("canvas");
    square.width = output;
    square.height = output;
    const squareCtx = square.getContext("2d");
    if (!squareCtx) return file;

    squareCtx.imageSmoothingEnabled = true;
    squareCtx.drawImage(
      canvas,
      minX,
      minY,
      contentWidth,
      contentHeight,
      (output - contentWidth) / 2,
      (output - contentHeight) / 2,
      contentWidth,
      contentHeight,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      square.toBlob((value) => resolve(value), "image/png"),
    );
    if (!blob) return file;

    return new File([blob], "logo.png", { type: "image/png" });
  } catch {
    return file;
  }
}
