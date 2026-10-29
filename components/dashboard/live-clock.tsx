"use client";

import { useEffect, useState } from "react";

const SCHOOL_TZ = "America/Costa_Rica";

/** School-local clock string (Costa Rica), 12h with seconds. */
export function schoolClock(now: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CR", {
    timeZone: SCHOOL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
}

/** Tick on whole seconds so the display never drifts. */
function scheduleTick(update: () => void): () => void {
  let handle: ReturnType<typeof setTimeout> | undefined;
  const step = () => {
    update();
    handle = setTimeout(step, 1000 - (Date.now() % 1000));
  };
  handle = setTimeout(step, 1000 - (Date.now() % 1000));
  return () => {
    if (handle) clearTimeout(handle);
  };
}

/**
 * Digital clock for the school timezone. Renders the server/first-paint value
 * after mount, then ticks every second and resyncs when the tab is visible
 * again (background tabs throttle timers).
 */
export function LiveClock({ locale, className }: { locale: string; className?: string }) {
  const [time, setTime] = useState(() => schoolClock(new Date(), locale));

  useEffect(() => {
    const update = () => setTime(schoolClock(new Date(), locale));
    let cleanup = scheduleTick(update);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      cleanup();
      update();
      cleanup = scheduleTick(update);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cleanup();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [locale]);

  return (
    <span className={className} suppressHydrationWarning>
      {time}
    </span>
  );
}
