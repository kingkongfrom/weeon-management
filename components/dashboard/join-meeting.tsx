"use client";

import { Video } from "lucide-react";

import { joinState } from "@/lib/calendar/meeting-link";

/**
 * Join control for a booked demo.
 *
 * - Opens the Cal.com location (Cal Video, Zoom, Meet…) in a new tab.
 * - Offered from 15 min before the start until 15 min after the end; earlier it
 *   says when it opens, later it says the demo has passed. The link stays
 *   available in the table regardless — Cal.com keeps the room.
 * - When the event is in person or by phone, shows the address/number instead
 *   of a button.
 *
 * `now` is passed in so the server render and the client agree.
 */
export function JoinMeeting({
  meeting,
  now,
  variant = "button",
}: {
  meeting: { startsAt: string; endsAt: string; location: string | null };
  now: string;
  variant?: "button" | "inline";
}) {
  const state = joinState(meeting, new Date(now));

  if (state.state === "unavailable") {
    const location = meeting.location?.trim();
    if (!location) return <span className="text-xs text-foreground/40">Sin enlace</span>;
    // Address or phone: show it, never as a link.
    return (
      <span className="block max-w-[16rem] text-xs leading-snug text-foreground/55">
        {location}
      </span>
    );
  }

  const time = new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(meeting.startsAt));

  const base =
    variant === "button"
      ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      : "inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold";

  if (state.state === "open") {
    return (
      <a
        href={state.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-[#5e25cc] text-white transition-colors hover:bg-[#4b1ea8]`}
      >
        <Video className="h-3.5 w-3.5" aria-hidden />
        Entrar
      </a>
    );
  }

  if (state.state === "early") {
    return (
      <a
        href={state.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} rounded-md border border-brand-300 bg-brand-50 px-1.5 py-0.5 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950/60 dark:text-brand-200`}
        title="El enlace se abre 15 minutos antes"
      >
        <Video className="h-3.5 w-3.5" aria-hidden />
        {time}
      </a>
    );
  }

  return (
    <a
      href={state.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} text-foreground/40 underline-offset-2 hover:underline`}
      title="La reunión ya terminó; el enlace sigue disponible"
    >
      Finalizada
    </a>
  );
}
