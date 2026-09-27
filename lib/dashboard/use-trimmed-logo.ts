"use client";

import { useEffect, useState } from "react";

import { trimLogoImage } from "@/lib/dashboard/logo-trim";

/** objectURL cache keyed by the stored logo URL. */
const trimCache = new Map<string, string>();

/**
 * Returns a tightly-cropped version of the stored school logo (white matte
 * removed) for circular display.
 *
 * Starts as `null` on both server and client so the first client render matches
 * SSR (the caller shows a stable placeholder), then resolves the cropped URL
 * after mount. Falls back to the original URL if the fetch/canvas work fails
 * (e.g. CORS), so it never breaks the UI.
 */
export function useTrimmedLogo(url: string | null | undefined): string | null {
  const [value, setValue] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!url) {
        if (!cancelled) {
          setValue(null);
          setReady(true);
        }
        return;
      }
      const cached = trimCache.get(url);
      if (cached) {
        setValue(cached);
        setReady(true);
        return;
      }
      try {
        const response = await fetch(url, { mode: "cors" });
        const blob = await response.blob();
        const file = new File([blob], "logo", { type: blob.type || "image/png" });
        const trimmed = await trimLogoImage(file);
        const objectUrl = URL.createObjectURL(trimmed);
        trimCache.set(url, objectUrl);
        if (!cancelled) setValue(objectUrl);
      } catch {
        if (!cancelled) setValue(url);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Never surface a value before mount resolved — keeps SSR and the first
  // client render identical.
  return ready ? value : null;
}
