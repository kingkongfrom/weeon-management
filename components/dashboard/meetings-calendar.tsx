"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
  Search,
  X,
} from "lucide-react";

import { JoinMeeting } from "@/components/dashboard/join-meeting";
import { costaRicaParts } from "@/lib/calendar/costa-rica-parts";
import type { StoredDemoMeeting } from "@/lib/calendar/demo-meetings-store";
import {
  CALENDAR_VIEWS,
  type CalendarView,
  addDays,
  groupByDay,
  longDateLabel,
  monthGrid,
  monthLabel,
  monthStart,
  sameMonth,
  shortMonthLabel,
  startOfWeek,
  untilLabel,
  weekDates,
  weekdayIndex,
  weekLabel,
} from "@/lib/calendar/meeting-views";

const OUTCOME_LABEL: Record<StoredDemoMeeting["outcome"], string> = {
  scheduled: "Agendada",
  held: "Realizada",
  no_show: "No asistió",
  cancelled: "Cancelada",
  converted: "Convertida",
};

const OUTCOME_STYLE: Record<StoredDemoMeeting["outcome"], string> = {
  scheduled: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  held: "bg-success-subtle text-success",
  converted: "bg-success-subtle text-success",
  no_show: "bg-warning-subtle text-warning",
  cancelled: "bg-surface-muted text-foreground/45 line-through",
};

const STATUS_LABEL: Record<StoredDemoMeeting["calStatus"], string> = {
  accepted: "Confirmada",
  pending: "Pendiente",
  awaiting_host: "En espera",
  cancelled: "Cancelada",
  rejected: "Rechazada",
};

const STATUS_STYLE: Record<StoredDemoMeeting["calStatus"], string> = {
  // Confirmed is the good state: solid green so it reads first in the panel.
  accepted: "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950",
  pending: "bg-warning-subtle text-warning",
  awaiting_host: "bg-warning-subtle text-warning",
  cancelled: "bg-surface-muted text-foreground/45",
  rejected: "bg-surface-muted text-foreground/45",
};

const VIEW_LABEL: Record<CalendarView, string> = {
  month: "Mes",
  week: "Semana",
  agenda: "Lista",
};

const VIEW_ICON: Record<CalendarView, typeof CalendarDays> = {
  month: CalendarDays,
  week: CalendarRange,
  agenda: ListChecks,
};

const WEEKDAY_HEAD = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Meeting = StoredDemoMeeting & {
  /** Costa Rica civil date — the agenda grouping key. */
  date: string;
  slot: { date: string; time: string };
  endTime: string;
};

function schoolOf(meeting: StoredDemoMeeting): string | null {
  const responses = meeting.bookingResponses;
  const value = responses.colegio ?? responses.school ?? responses["institución"] ?? responses.institucion;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function meetingName(meeting: StoredDemoMeeting): string {
  return schoolOf(meeting) ?? meeting.attendeeName ?? meeting.title;
}

const isPending = (meeting: StoredDemoMeeting) =>
  meeting.calStatus === "pending" || meeting.calStatus === "awaiting_host";

/**
 * Meetings calendar for Ops.
 *
 * One dataset, three ways to look at it:
 * - **Mes** — the classic six-week grid; each day cell carries up to two chips
 *   and a "+N" that opens the day panel.
 * - **Semana** — seven wide columns with full titles, times and the join
 *   control, for the week you are actually doing demos.
 * - **Lista** — the agenda (next up / history), best on a phone.
 *
 * Everything is client-side: the server hands over a bounded window (two weeks
 * back, eight ahead) and every view, filter and panel works on that array, so
 * switching views is instant. Month grids outside the window still render —
 * empty, which is the truth.
 */
export function MeetingsCalendar({
  meetings,
  now,
  todayISO,
  initialView = "month",
  initialState = null,
}: {
  meetings: StoredDemoMeeting[];
  now: string;
  todayISO: string;
  initialView?: CalendarView;
  /** `?m=<meeting id>` — opened from the landing strip or a shared link. */
  initialState?: string | null;
}) {
  const nowMs = new Date(now).getTime();

  const rows = useMemo<Meeting[]>(
    () =>
      meetings
        .map((meeting) => {
          const slot = costaRicaParts(meeting.startsAt);
          return {
            ...meeting,
            // Trust the stored meeting_date (the grouping key of every view).
            date: meeting.meetingDate || slot.date,
            slot,
            endTime: costaRicaParts(meeting.endsAt).time,
          };
        })
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [meetings],
  );

  const [view, setView] = useState<CalendarView>(initialView);
  const [anchor, setAnchor] = useState<string>(todayISO);
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [openId, setOpenId] = useState<string | null>(initialState);
  const [panel, setPanel] = useState(true);

  // Keep the URL shareable without a navigation: ?view=…&m=…
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (view === "month") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    if (openId) url.searchParams.set("m", openId);
    else url.searchParams.delete("m");
    window.history.replaceState(null, "", url);
  }, [view, openId]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  // The day panel is a bottom sheet on phones: lock the page behind it so
  // iOS/Safari does not scroll the calendar under your finger.
  useEffect(() => {
    if (!openId || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1280px)").matches) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [openId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((meeting) => {
      if (onlyPending && !isPending(meeting)) return false;
      if (!q) return true;
      return [meeting.attendeeName, meeting.attendeeEmail, meeting.attendeePhone, schoolOf(meeting), meeting.title, meeting.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, query, onlyPending]);

  const byDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const meeting of filtered) {
      const list = map.get(meeting.date);
      if (list) list.push(meeting);
      else map.set(meeting.date, [meeting]);
    }
    return map;
  }, [filtered]);

  const upcoming = useMemo(
    () => rows.filter((meeting) => new Date(meeting.endsAt).getTime() >= nowMs),
    [rows, nowMs],
  );
  const past = useMemo(
    () => rows.filter((meeting) => new Date(meeting.endsAt).getTime() < nowMs).reverse(),
    [rows, nowMs],
  );

  const selected = openId ? rows.find((meeting) => meeting.id === openId) ?? null : null;
  const selectedDay = selected?.meetingDate ?? null;
  const dayMeetings = selectedDay
    ? (byDay.get(selectedDay) ?? rows.filter((m) => m.meetingDate === selectedDay))
    : [];

  /* ----------------------------- navigation ----------------------------- */

  const shift = useCallback(
    (direction: -1 | 1) => {
      if (view === "month") setAnchor((current) => monthStart(current, direction));
      else if (view === "week") setAnchor((current) => addDays(startOfWeek(current), direction * 7));
      else setAnchor(addDays(todayISO, 0));
    },
    [view, todayISO],
  );

  const goToday = useCallback(() => setAnchor(todayISO), [todayISO]);

  const goTo = (iso: string) => {
    setAnchor(iso);
    if (view === "agenda") setView("week");
  };

  // Keyboard: ←/→ move the window, T returns to today, 1/2/3 switch views.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") shift(-1);
      else if (event.key === "ArrowRight") shift(1);
      else if (event.key.toLowerCase() === "t") goToday();
      else if (event.key === "1") setView("month");
      else if (event.key === "2") setView("week");
      else if (event.key === "3") setView("agenda");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shift, goToday]);

  const title =
    view === "month"
      ? monthLabel(anchor)
      : view === "week"
        ? `Semana del ${weekLabel(anchor)}`
        : "Próximas y pasadas";

  const thisWeek = upcoming.filter((meeting) => {
    const monday = startOfWeek(todayISO);
    const sunday = addDays(monday, 6);
    return meeting.meetingDate >= monday && meeting.meetingDate <= sunday;
  }).length;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="brand-page-title text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Reuniones
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground/55">
            {/* The sentence is the first thing to go on a phone: the calendar is the page. */}
            <span className="hidden sm:inline">Demos agendadas desde el sitio.</span>
            <Stat value={upcoming.length} label="por venir" />
            <Sep />
            <button
              type="button"
              onClick={() => setOnlyPending(true)}
              className="inline-flex items-baseline gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <Stat value={upcoming.filter(isPending).length} label="por confirmar" tone="warning" />
            </button>
            <Sep />
            <Stat value={thisWeek} label="esta semana" />
            <Sep />
            <Stat
              value={past.filter((meeting) => meeting.outcome === "converted").length}
              label="convertidas"
              tone="success"
            />
          </p>
        </div>
        <Link
          href="/dashboard/onboarding"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-surface-muted/40 hover:text-foreground"
        >
          <CalendarClock className="h-4 w-4" aria-hidden />
          Nuevo colegio
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/60 px-2.5 py-2 sm:px-3">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label={view === "month" ? "Mes anterior" : "Anterior"}
                className="grid h-11 w-10 place-items-center rounded-lg text-foreground/55 transition-colors hover:bg-surface-muted/60 hover:text-foreground sm:h-8 sm:w-8"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => shift(1)}
                aria-label={view === "month" ? "Mes siguiente" : "Siguiente"}
                className="grid h-11 w-10 place-items-center rounded-lg text-foreground/55 transition-colors hover:bg-surface-muted/60 hover:text-foreground sm:h-8 sm:w-8"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <h2 className="order-2 min-w-0 flex-1 basis-[60%] truncate text-sm font-bold capitalize text-foreground sm:order-none sm:basis-auto sm:text-base">
              {title}
            </h2>

            <button
              type="button"
              onClick={goToday}
              className="order-1 ml-auto rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-surface-muted/40 hover:text-foreground sm:order-none sm:ml-0 sm:py-1"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => setPanel((current) => !current)}
              aria-pressed={panel}
              className="order-1 hidden h-8 w-8 place-items-center rounded-lg text-foreground/45 transition-colors hover:bg-surface-muted/60 hover:text-foreground xl:grid"
              title={panel ? "Ocultar panel del día" : "Mostrar panel del día"}
            >
              {panel ? (
                <PanelRightClose className="h-4 w-4" aria-hidden />
              ) : (
                <PanelRightOpen className="h-4 w-4" aria-hidden />
              )}
            </button>

            <div
              className="order-3 -mx-0.5 flex w-full rounded-xl border border-border bg-surface p-0.5 sm:order-none sm:ml-auto sm:w-auto sm:rounded-lg"
              role="tablist"
              aria-label="Vista"
            >
              {CALENDAR_VIEWS.map((item) => {
                const Icon = VIEW_ICON[item];
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={view === item}
                    onClick={() => setView(item)}
                    className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:flex-none sm:rounded-md sm:py-1 ${
                      view === item
                        ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-900/40 dark:text-brand-200"
                        : "text-foreground/55 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {VIEW_LABEL[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2 sm:flex-wrap sm:px-3">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35"
                aria-hidden
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Buscar asistente, colegio o correo"
                aria-label="Buscar reunión"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-8 pr-8 text-base text-foreground outline-none placeholder:text-sm placeholder:text-foreground/35 focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 sm:h-8 sm:text-sm dark:focus:border-brand-700 dark:focus:ring-brand-800/60"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded text-foreground/40 hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => setOnlyPending((current) => !current)}
              aria-pressed={onlyPending}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:h-auto sm:py-1 ${
                onlyPending
                  ? "border-[#eab308]/60 bg-warning-subtle text-warning"
                  : "border-border text-foreground/60 hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" aria-hidden />
              <span className="whitespace-nowrap">Por confirmar</span>
            </button>
          </div>

          {view === "month" ? (
            <MonthView
              anchor={anchor}
              todayISO={todayISO}
              byDay={byDay}
              selectedDay={selectedDay}
              onSelectDay={(iso) => {
                setAnchor(iso);
                const first = byDay.get(iso)?.[0];
                setOpenId(first ? first.id : null);
              }}
            />
          ) : view === "week" ? (
            <WeekView
              anchor={anchor}
              todayISO={todayISO}
              byDay={byDay}
              now={now}
              selectedId={openId}
              onSelect={(meeting) => setOpenId(meeting.id)}
              onGoToDay={goTo}
            />
          ) : (
            <AgendaView
              upcoming={upcoming}
              past={past}
              todayISO={todayISO}
              selectedId={openId}
              onSelect={(meeting) => {
                setOpenId(meeting.id);
              }}
              onGoToDay={goTo}
              filteredIds={new Set(filtered.map((meeting) => meeting.id))}
            />
          )}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-3 py-2 text-[11px] font-medium text-foreground/40">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" aria-hidden /> Pendiente de confirmar
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" aria-hidden /> Cancelada
            </span>
            <span className="ml-auto hidden sm:inline">
              ← → cambia el período · T hoy · 1/2/3 vistas
            </span>
          </footer>
        </section>

        {panel ? (
          <DayPanel
            day={selectedDay}
            meetings={dayMeetings}
            now={now}
            todayISO={todayISO}
            selectedId={openId}
            onSelect={setOpenId}
            onClose={() => setOpenId(null)}
            onOpenWeek={() => {
              if (selectedDay) goTo(selectedDay);
              setView("week");
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Month                                                                     */
/* ------------------------------------------------------------------------- */

function MonthView({
  anchor,
  todayISO,
  byDay,
  selectedDay,
  onSelectDay,
}: {
  anchor: string;
  todayISO: string;
  byDay: Map<string, Meeting[]>;
  selectedDay: string | null;
  onSelectDay: (iso: string) => void;
}) {
  const grid = monthGrid(anchor);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border/60 bg-surface-muted/30">
        {WEEKDAY_HEAD.map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-foreground/45"
          >
            {/* One letter on phones keeps seven columns legible at 320px. */}
            <span aria-hidden>{day.slice(0, 1)}</span>
            <span className="sr-only">{day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((iso, index) => {
          const inside = sameMonth(iso, anchor);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDay;
          const meetings = byDay.get(iso) ?? [];
          const weekend = index % 7 >= 5;
          const extra = meetings.length - 2;
          return (
            <div
              key={iso}
              className={`relative min-h-[3.25rem] border-b border-r border-border/50 sm:min-h-[6.5rem] ${
                weekend && inside ? "bg-surface-muted/20" : ""
              } ${inside ? "" : "bg-surface-muted/30"} ${
                isSelected ? "ring-1 ring-inset ring-brand-300 dark:ring-brand-700" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(iso)}
                aria-label={`${longDateLabel(iso)}, ${meetings.length} ${meetings.length === 1 ? "reunión" : "reuniones"}`}
                className="absolute inset-0 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
              />
              <span
                className={`pointer-events-none relative z-10 mx-auto mt-1 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold tabular-nums sm:ml-1 sm:mt-1 sm:text-xs ${
                  isToday
                    ? "bg-brand-600 text-white"
                    : inside
                      ? "text-foreground/75"
                      : "text-foreground/30"
                }`}
              >
                {Number(iso.slice(-2))}
              </span>

              {/* Phones: dots — honest density without unreadable 8px text. */}
              <span className="pointer-events-none relative z-10 mt-1 flex items-center justify-center gap-0.5 sm:hidden">
                {meetings.slice(0, 3).map((meeting) => {
                  const cancelled = meeting.outcome === "cancelled" || meeting.calStatus === "cancelled";
                  return (
                    <span
                      key={meeting.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        cancelled ? "bg-foreground/25" : isPending(meeting) ? "bg-[#eab308]" : "bg-brand-500"
                      }`}
                    />
                  );
                })}
                {extra > 0 ? (
                  <span className="text-[9px] font-bold leading-none text-foreground/40">+{extra}</span>
                ) : null}
              </span>

              <ul className="pointer-events-none relative z-10 mt-0.5 hidden space-y-0.5 px-1 sm:block">
                {meetings.slice(0, 2).map((meeting) => {
                  const cancelled = meeting.outcome === "cancelled" || meeting.calStatus === "cancelled";
                  return (
                    <li
                      key={meeting.id}
                      className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10.5px] font-semibold leading-tight sm:text-[11px] ${
                        cancelled
                          ? "bg-surface-muted text-foreground/40 line-through"
                          : "bg-brand-50/80 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
                      }`}
                    >
                      <span className="shrink-0 tabular-nums opacity-70">{meeting.slot.time}</span>
                      <span className="truncate">{meetingName(meeting)}</span>
                      {isPending(meeting) ? (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#eab308]" aria-hidden />
                      ) : null}
                    </li>
                  );
                })}
                {extra > 0 ? (
                  <li className="pl-1 text-[10px] font-semibold text-foreground/45">+{extra} más</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Week                                                                      */
/* ------------------------------------------------------------------------- */

function WeekView({
  anchor,
  todayISO,
  byDay,
  now,
  selectedId,
  onSelect,
  onGoToDay,
}: {
  anchor: string;
  todayISO: string;
  byDay: Map<string, Meeting[]>;
  now: string;
  selectedId: string | null;
  onSelect: (meeting: Meeting) => void;
  onGoToDay: (iso: string) => void;
}) {
  const dates = weekDates(anchor);

  return (
    // Phones: natively scrolling day columns with snap, today first — the same
    // swipe feel as the mobile ERP, no 44rem horizontal drag across a tiny
    // viewport. md+: the seven-column grid.
    <div className="no-scrollbar -mx-px snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:snap-none md:overflow-visible">
      <div className="flex md:grid md:grid-cols-7 md:divide-x md:divide-border/50">
        {dates.map((iso) => {
          const isToday = iso === todayISO;
          const meetings = byDay.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={`flex w-[calc(100%-2rem)] min-w-[13rem] shrink-0 snap-start flex-col border-r border-border/50 last:border-r-0 md:w-auto md:min-w-0 md:border-r-0 ${
                isToday ? "bg-brand-50/20 dark:bg-brand-950/20" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onGoToDay(iso)}
                className={`flex items-center justify-center gap-2 px-1 py-2 text-center transition-colors hover:bg-surface-muted/40 md:flex-col md:gap-0.5 ${isToday ? "md:justify-start" : ""}`}
                title="Ver este día en el panel"
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-foreground/45">
                  {weekdayShort(iso)}
                </span>
                <span
                  className={`grid h-7 min-w-7 place-items-center rounded-full px-1 text-sm font-bold tabular-nums ${
                    isToday ? "bg-brand-600 text-white" : "text-foreground/80"
                  }`}
                >
                  {Number(iso.slice(-2))}
                </span>
                {Number(iso.slice(-2)) === 1 ? (
                  <span className="text-[10px] font-semibold uppercase text-foreground/30 md:text-[9px]">
                    {shortMonthLabel(iso)}
                  </span>
                ) : null}
              </button>

              <ul className="flex-1 space-y-1 px-2 pb-3 md:px-1 md:pb-2">
                {meetings.length === 0 ? (
                  <li className="pt-2 text-center text-[11px] font-medium text-foreground/25">—</li>
                ) : null}
                {meetings.map((meeting) => {
                  const active = meeting.id === selectedId;
                  const cancelled = meeting.outcome === "cancelled" || meeting.calStatus === "cancelled";
                  const soon =
                    new Date(meeting.startsAt).getTime() - new Date(now).getTime() < 60 * 60_000 &&
                    new Date(meeting.endsAt).getTime() >= new Date(now).getTime();
                  return (
                    <li key={meeting.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(meeting)}
                        aria-pressed={active}
                        className={`w-full rounded-lg border px-2 py-2 text-left transition-colors md:px-1.5 md:py-1 ${
                          active
                            ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300 dark:border-brand-600 dark:bg-brand-900/40"
                            : cancelled
                              ? "border-border/60 bg-surface-muted/40"
                              : "border-border/70 bg-surface hover:bg-brand-50/40 dark:hover:bg-brand-950/30"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="text-[11px] font-bold tabular-nums text-foreground/55 md:text-[10px]">
                            {meeting.slot.time}
                          </span>
                          <span className="text-[11px] tabular-nums text-foreground/35 md:hidden">–{meeting.endTime}</span>
                          {isPending(meeting) ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" aria-hidden />
                          ) : null}
                          {soon ? (
                            <span className="ml-auto rounded bg-brand-600 px-1 text-[9px] font-bold uppercase text-white md:text-[8px]">
                              Ya
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`mt-0.5 block text-[13px] font-semibold leading-snug md:text-[11px] ${
                            cancelled ? "text-foreground/40 line-through" : "text-foreground"
                          }`}
                        >
                          {meetingName(meeting)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-foreground/45 md:hidden">
                          <span
                            className={`rounded-full px-1 py-px text-[9px] font-bold uppercase ${
                              meeting.calStatus === "accepted"
                                ? "bg-emerald-600 text-white"
                                : STATUS_STYLE[meeting.calStatus]
                            }`}
                          >
                            {STATUS_LABEL[meeting.calStatus]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Agenda                                                                    */
/* ------------------------------------------------------------------------- */

function AgendaView({
  upcoming,
  past,
  todayISO,
  selectedId,
  onSelect,
  onGoToDay,
  filteredIds,
}: {
  upcoming: Meeting[];
  past: Meeting[];
  todayISO: string;
  selectedId: string | null;
  onSelect: (meeting: Meeting) => void;
  onGoToDay: (iso: string) => void;
  filteredIds: Set<string>;
}) {
  const up = upcoming.filter((meeting) => filteredIds.has(meeting.id));
  const down = past.filter((meeting) => filteredIds.has(meeting.id)).slice(0, 30);
  const groups = [
    { key: "up", label: "Próximas", days: groupByDay(up, "asc") },
    { key: "down", label: "Recientes", days: groupByDay(down, "desc") },
  ];

  if (up.length === 0 && down.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-border/60">
      {groups.map((group) =>
        group.days.length === 0 ? null : (
          <div key={group.key} className="py-1">
            <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-foreground/40">
              {group.label}
            </p>
            {group.days.map((day) => (
              <div key={day.iso} className="flex gap-2 px-2 py-2 sm:gap-3 sm:px-3">
                <button
                  type="button"
                  onClick={() => onGoToDay(day.iso)}
                  className="w-11 shrink-0 pt-0.5 text-center sm:w-14 sm:text-left"
                  title="Ver esta semana"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-foreground/40">
                    {weekdayShort(day.iso)}
                  </span>
                  <span
                    className={`block text-xl font-bold leading-none tabular-nums ${
                      day.iso === todayISO ? "text-brand-700 dark:text-brand-200" : "text-foreground/75"
                    }`}
                  >
                    {Number(day.iso.slice(-2))}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase text-foreground/35">
                    {shortMonthLabel(day.iso)}
                  </span>
                </button>
                <ul className="min-w-0 flex-1 space-y-1">
                  {day.items.map((meeting) => {
                    const active = meeting.id === selectedId;
                    const cancelled = meeting.outcome === "cancelled" || meeting.calStatus === "cancelled";
                    return (
                      <li key={meeting.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(meeting)}
                          aria-pressed={active}
                          className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors sm:px-2.5 sm:py-1.5 ${
                            active
                              ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300 dark:border-brand-600 dark:bg-brand-900/40"
                              : "border-transparent hover:border-border hover:bg-surface-muted/40"
                          }`}
                        >
                          <span className="w-10 shrink-0 text-xs font-bold tabular-nums text-foreground/55">
                            {meeting.slot.time}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                cancelled ? "text-foreground/40 line-through" : "text-foreground"
                              }`}
                            >
                              {meetingName(meeting)}
                            </span>
                            <span className="block truncate text-[11px] text-foreground/45">
                              {meeting.attendeeName ?? "—"}
                              {schoolOf(meeting) && meeting.attendeeName ? ` · ${meeting.title}` : ""}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              meeting.calStatus === "accepted"
                                ? "bg-emerald-600 text-white"
                                : OUTCOME_STYLE[meeting.outcome]
                            }`}
                          >
                            {meeting.calStatus === "accepted" ? "Confirmada" : OUTCOME_LABEL[meeting.outcome]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ),
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Day panel                                                                 */
/* ------------------------------------------------------------------------- */

function DayPanel({
  day,
  meetings,
  now,
  todayISO,
  selectedId,
  onSelect,
  onClose,
  onOpenWeek,
}: {
  day: string | null;
  meetings: Meeting[];
  now: string;
  todayISO: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onOpenWeek: () => void;
}) {
  const nowMs = new Date(now).getTime();
  const open = Boolean(day);

  return (
    <>
      {/* Phones: dim the page behind the sheet. Tapping it closes the sheet. */}
      {open ? (
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] xl:hidden"
        />
      ) : null}

      <aside
        aria-label="Detalle del día"
        role="dialog"
        aria-modal="false"
        className={
          open
            ? "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 flex max-h-[78dvh] flex-col overflow-hidden rounded-t-2xl border border-border/80 bg-surface shadow-elevated xl:static xl:z-auto xl:max-h-none xl:rounded-2xl xl:shadow-sm xl:sticky xl:top-4 xl:self-start"
            : "hidden flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm xl:flex xl:sticky xl:top-4 xl:self-start"
        }
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground sm:text-sm">
              {day ? longDateLabel(day) : "Detalle"}
            </p>
            <p className="text-[11px] font-medium text-foreground/45">
              {day === todayISO ? "Hoy · " : ""}
              {meetings.length === 0
                ? "Sin reuniones"
                : `${meetings.length} ${meetings.length === 1 ? "reunión" : "reuniones"}`}
              {" · Hora de Costa Rica"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {day ? (
              <button
                type="button"
                onClick={onOpenWeek}
                className="py-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-200"
              >
                Ver semana
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="grid h-9 w-9 place-items-center rounded-lg text-foreground/50 transition-colors hover:bg-surface-muted/60 hover:text-foreground xl:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch] xl:max-h-[36rem] xl:flex-none">
          {!day ? (
            <p className="px-2 py-6 text-center text-xs font-medium text-foreground/40">
              Elige un día o una reunión para ver el detalle.
            </p>
          ) : meetings.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs font-medium text-foreground/40">
              No hay demos agendadas ese día.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {meetings.map((meeting) => {
                const active = meeting.id === selectedId;
                const school = schoolOf(meeting);
                const cancelled = meeting.outcome === "cancelled" || meeting.calStatus === "cancelled";
                return (
                  <li key={meeting.id}>
                    <div
                      className={`rounded-xl border p-2.5 transition-colors sm:p-2 ${
                        active ? "border-brand-300 bg-brand-50/40 dark:border-brand-700 dark:bg-brand-950/30" : "border-border/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(meeting.id)}
                        aria-pressed={active}
                        className="block w-full text-left"
                      >
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-foreground/35" aria-hidden />
                          <span className="text-xs font-bold tabular-nums text-foreground/60 sm:text-[11px]">
                            {meeting.slot.time}–{meeting.endTime}
                          </span>
                          {isPending(meeting) ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" aria-hidden />
                          ) : null}
                          <span
                            className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[meeting.calStatus]}`}
                          >
                            {meeting.calStatus === "accepted" ? (
                              <Check className="h-3 w-3" aria-hidden />
                            ) : null}
                            {STATUS_LABEL[meeting.calStatus]}
                          </span>
                        </span>
                        <span
                          className={`mt-1 block text-[15px] font-bold leading-snug sm:text-sm ${
                            cancelled ? "text-foreground/40 line-through" : "text-foreground"
                          }`}
                        >
                          {school ?? meeting.attendeeName ?? meeting.title}
                        </span>
                        {school && meeting.attendeeName ? (
                          <span className="block truncate text-[13px] font-medium text-foreground/55 sm:text-xs">
                            {meeting.attendeeName}
                          </span>
                        ) : null}
                        {meeting.attendeeEmail ? (
                          <a
                            href={`mailto:${meeting.attendeeEmail}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate text-[13px] text-foreground/50 underline-offset-2 hover:text-foreground hover:underline sm:text-[11px]"
                          >
                            {meeting.attendeeEmail}
                          </a>
                        ) : null}
                        {meeting.attendeePhone ? (
                          <a
                            href={`tel:${meeting.attendeePhone.replace(/[^+\d]/g, "")}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block text-[13px] text-foreground/50 underline-offset-2 hover:text-foreground hover:underline sm:text-[11px]"
                          >
                            {meeting.attendeePhone}
                          </a>
                        ) : null}
                        <span className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${OUTCOME_STYLE[meeting.outcome]}`}
                          >
                            {OUTCOME_LABEL[meeting.outcome]}
                          </span>
                          {meeting.location && !/^https?:\/\//i.test(meeting.location) ? (
                            <span className="inline-flex min-w-0 items-center gap-0.5 truncate text-[10px] font-medium text-foreground/45">
                              <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                              <span className="truncate">{meeting.location}</span>
                            </span>
                          ) : null}
                        </span>
                        {meeting.notes ? (
                          <span className="mt-1 block whitespace-pre-line text-[12px] leading-snug text-foreground/50 sm:text-[11px]">
                            {meeting.notes}
                          </span>
                        ) : null}
                      </button>
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2 sm:mt-1.5 sm:pt-1.5">
                        <span className="text-[11px] font-semibold tabular-nums text-foreground/40 sm:text-[10px]">
                          {new Date(meeting.endsAt).getTime() >= nowMs
                            ? untilLabel(meeting.startsAt, nowMs)
                            : "Finalizada"}
                        </span>
                        <JoinMeeting
                          meeting={{ startsAt: meeting.startsAt, endsAt: meeting.endsAt, location: meeting.location }}
                          now={now}
                          variant="inline"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {day ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border-t border-border/60 px-3 py-2.5 text-xs font-semibold text-foreground/45 hover:text-foreground xl:hidden"
          >
            Cerrar detalle
          </button>
        ) : null}
      </aside>
    </>
  );
}

function Sep() {
  return <span className="text-foreground/20" aria-hidden>·</span>;
}

/** Inline figure in the header line — no card, no icon well. */
function Stat({
  value,
  label,
  tone = "default",
}: {
  value: string | number;
  label: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-[#a16207] dark:text-[#facc15]"
      : tone === "success"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-foreground";
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`text-base font-bold tabular-nums ${toneClass}`}>{value}</span>
      <span className="text-xs font-medium text-foreground/45">{label}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-foreground/55">No hay reuniones en este período.</p>
      <p className="mt-1 text-xs font-medium text-foreground/40">
        Las demos agendadas desde el sitio aparecen aquí al instante (webhook de Cal.com).
      </p>
    </div>
  );
}

function weekdayShort(iso: string): string {
  return WEEKDAY_HEAD[weekdayIndex(iso)] ?? "";
}
