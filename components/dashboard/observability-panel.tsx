import { Activity, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import type { Messages } from "@/lib/i18n/messages";
import {
  NAV_BUDGET_MS,
  type NavTimingSnapshot,
} from "@/lib/observability/nav-timings";
import type {
  ObservabilitySnapshot,
  SentryIssueSummary,
  SentrySurfaceSnapshot,
} from "@/lib/observability/sentry-platform";

function levelTone(level: string): string {
  const l = level.toLowerCase();
  if (l === "fatal" || l === "error") {
    return "bg-error/10 text-error";
  }
  if (l === "warning") {
    return "bg-warning/10 text-warning";
  }
  return "bg-foreground/10 text-foreground/60";
}

/**
 * Teacher-web perceived latency: subject-pill and tab interactions, measured on
 * the client and aggregated per hour (`nav_timings`). Shows the two phases we
 * budget for — feedback (`active`) and content painted — so a regression is a
 * number here before a teacher reports it.
 */
function NavTimingSection({ snapshot }: { snapshot: NavTimingSnapshot }) {
  const label = (phase: string) => (phase === "active" ? "Feedback" : "Contenido");
  const budget = (phase: string) =>
    phase === "active" ? NAV_BUDGET_MS.active : NAV_BUDGET_MS.content;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/45">
            Latencia de la app docente
          </h2>
          <p className="mt-1 text-sm text-foreground/55">
            Cambios de materia y de pestaña en <code>teachers.weeon.school</code>, medidos en el
            navegador y agregados por hora. Últimos {snapshot.windowDays} días.
          </p>
        </div>
        <p className="text-xs font-semibold text-foreground/40">
          {snapshot.totalSamples.toLocaleString("es-CR")} muestras
        </p>
      </div>

      {snapshot.reason ? (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm font-medium text-warning">
          {snapshot.reason}
        </p>
      ) : snapshot.series.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-foreground/45">
          Sin muestras todavía. La telemetría llega con el uso normal de la app docente.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border/70 text-xs font-semibold text-foreground/55">
              <tr>
                <th className="px-3 py-2">Pantalla</th>
                <th className="px-3 py-2">Interacción</th>
                <th className="px-3 py-2">Fase</th>
                <th className="px-3 py-2 text-right">p50</th>
                <th className="px-3 py-2 text-right">p90</th>
                <th className="px-3 py-2 text-right">Máx</th>
                <th className="px-3 py-2 text-right">Muestras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {snapshot.series.slice(0, 12).map((series) =>
                series.phases.map((phase) => {
                  const over = phase.p90Ms > budget(phase.phase);
                  return (
                    <tr key={`${series.route}-${series.kind}-${phase.phase}`}>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/60">
                        {series.route}
                      </td>
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {series.kind === "subject" ? "Materia" : "Pestaña"}
                      </td>
                      <td className="px-3 py-2 text-foreground/70">{label(phase.phase)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground/70">
                        {phase.p50Ms} ms
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold tabular-nums ${
                          over ? "text-error" : "text-success"
                        }`}
                        title={`Presupuesto: ${budget(phase.phase)} ms p90`}
                      >
                        {phase.p90Ms} ms
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                        {phase.maxMs} ms
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground/50">
                        {phase.samples.toLocaleString("es-CR")}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-foreground/45">
            Presupuesto: feedback ≤ {NAV_BUDGET_MS.active} ms y contenido ≤ {NAV_BUDGET_MS.content}{" "}
            ms en p90. Un p90 en rojo significa que la interacción ya se siente lenta.
          </p>
        </div>
      )}
    </section>
  );
}

function formatLastSeen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function IssueRow({
  issue,
  locale,
  t,
}: {
  issue: SentryIssueSummary;
  locale: string;
  t: Messages;
}) {
  return (
    <li className="flex flex-col gap-1 border-t border-border px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelTone(issue.level)}`}
          >
            {issue.level}
          </span>
          <span className="text-xs font-medium text-foreground/45">
            {t.observability.events(issue.eventCount)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{issue.title}</p>
        <p className="text-xs text-foreground/45">
          {t.observability.lastSeen} {formatLastSeen(issue.lastSeen, locale)}
        </p>
      </div>
      <a
        href={issue.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300 sm:mt-0"
      >
        {t.observability.openIssue}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </li>
  );
}

function SurfaceCard({
  surface,
  orgSlug,
  t,
  locale,
}: {
  surface: SentrySurfaceSnapshot;
  orgSlug?: string;
  t: Messages;
  locale: string;
}) {
  const surfaceCopy = t.observability.surfaces[surface.id];
  const hasIssues = surface.status === "ok" && surface.unresolvedCount > 0;
  const notLinked = surface.status === "not_linked";
  const apiError = surface.status === "api_error";
  const healthy = surface.status === "ok" && surface.unresolvedCount === 0;
  const projectUrl =
    orgSlug && !notLinked
      ? `https://${orgSlug}.sentry.io/issues/?query=is%3Aunresolved+project%3A${encodeURIComponent(surface.projectSlug)}`
      : undefined;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              hasIssues
                ? "border-error/30 bg-error/10 text-error"
                : apiError
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : notLinked
                    ? "border-foreground/15 bg-foreground/5 text-foreground/45"
                    : "border-success/30 bg-success/10 text-success"
            }`}
          >
            {hasIssues || apiError ? (
              <AlertTriangle className="h-5 w-5" aria-hidden />
            ) : (
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">{surfaceCopy.title}</h2>
            <p className="text-sm font-medium text-foreground/50">
              {surfaceCopy.description}{" "}
              <span className="font-mono text-xs text-foreground/40">({surface.projectSlug})</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              hasIssues
                ? "bg-error/10 text-error"
                : notLinked
                  ? "bg-foreground/10 text-foreground/50"
                  : apiError
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
            }`}
          >
            {notLinked
              ? t.observability.notLinkedBadge
              : hasIssues
                ? `${t.observability.issuesCount(surface.unresolvedCount)}${surface.hasMoreUnresolved ? "+" : ""}`
                : apiError
                  ? t.observability.apiErrorBadge
                  : t.observability.allClear}
          </span>
          {projectUrl ? (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-surface-muted"
            >
              Sentry
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </header>

      {notLinked ? (
        <p className="px-4 py-3 text-sm font-medium text-foreground/55 sm:px-5">
          {t.observability.projectNotLinked(surface.projectSlug)}
        </p>
      ) : null}

      {apiError && surface.error ? (
        <p className="px-4 py-3 text-sm font-medium text-warning sm:px-5">{surface.error}</p>
      ) : null}

      {surface.issues.length > 0 ? (
        <ul>
          {surface.issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} locale={locale} t={t} />
          ))}
        </ul>
      ) : healthy ? (
        <p className="px-4 py-4 text-sm text-foreground/45 sm:px-5">{t.observability.noIssuesBody}</p>
      ) : null}

      {surface.hasMoreUnresolved ? (
        <p className="border-t border-border px-4 py-2 text-xs font-medium text-foreground/45 sm:px-5">
          {t.observability.hasMore}
        </p>
      ) : null}
    </section>
  );
}

export function ObservabilityPanel({
  snapshot,
  navTimings,
  t,
  locale,
}: {
  snapshot: ObservabilitySnapshot;
  /** Teacher-web navigation timings over the last week. */
  navTimings: NavTimingSnapshot;
  t: Messages;
  locale: string;
}) {
  const updatedLabel = formatLastSeen(snapshot.fetchedAt, locale);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground/60">
            <Activity className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
            Sentry
          </div>
          <h1 className="brand-page-title text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t.observability.pageTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-foreground/55">
            {t.observability.pageDescription}
          </p>
        </div>
        {snapshot.sentryOrgIssuesUrl ? (
          <a
            href={snapshot.sentryOrgIssuesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
          >
            {t.observability.openSentry}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/45">
          {t.observability.uptimeTitle}
        </h2>
        <p className="mt-1 text-sm text-foreground/55">{t.observability.uptimeDescription}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {snapshot.uptime.map((probe) => {
            const label = t.observability.surfaces[probe.id].title;
            return (
              <li
                key={probe.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                  probe.ok ? "border-success/25 bg-success/5" : "border-error/30 bg-error/5"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                  <p className="truncate font-mono text-[11px] text-foreground/40">{probe.url}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-xs font-bold ${probe.ok ? "text-success" : "text-error"}`}
                  >
                    {probe.ok
                      ? t.observability.uptimeUp(probe.latencyMs)
                      : t.observability.uptimeDown}
                  </p>
                  {probe.statusCode ? (
                    <p className="text-[10px] text-foreground/40">HTTP {probe.statusCode}</p>
                  ) : probe.error ? (
                    <p className="max-w-[8rem] truncate text-[10px] text-foreground/40">
                      {probe.error}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {snapshot.uptimeDown > 0 ? (
          <p className="mt-3 text-sm font-medium text-error">
            {t.observability.uptimeSummaryDown(snapshot.uptimeDown)}
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-success">{t.observability.uptimeSummaryUp}</p>
        )}
      </section>

      {snapshot.reason ? (
        <p className="rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm font-medium text-warning">
          {snapshot.reason}
        </p>
      ) : (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            snapshot.totalUnresolved === 0
              ? "border-success/30 bg-success/5 text-success"
              : "border-error/30 bg-error/5 text-error"
          }`}
        >
          {snapshot.totalUnresolved === 0
            ? t.observability.summaryAllClear
            : t.observability.summaryIssues(snapshot.totalUnresolved)}
          <span className="ml-2 font-normal text-foreground/45">
            · {t.observability.updatedAt(updatedLabel)}
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {snapshot.surfaces.map((surface) => (
          <SurfaceCard
            key={surface.id}
            surface={surface}
            orgSlug={snapshot.orgSlug}
            t={t}
            locale={locale}
          />
        ))}
      </div>

      {/* Self-hosted, own feature: teacher-web interaction latency measured in
          the browser. It sat between the uptime probes and the Sentry summary,
          which made it read as part of Sentry — it has no Sentry data at all.
          A rule and its own block keep the two sources visually separate. */}
      <div className="mt-2 border-t border-border pt-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/35">
          Telemetría propia del producto — no viene de Sentry
        </p>
        <NavTimingSection snapshot={navTimings} />
      </div>
    </div>
  );
}
