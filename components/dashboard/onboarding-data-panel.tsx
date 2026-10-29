"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  FileSpreadsheet,
  Link2,
  Loader2,
  Mail,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  createUploadLinkAction,
  loadOnboardingUploads,
  revokeUploadLinkAction,
} from "@/lib/dashboard/onboarding-data-actions";
import type { OnboardingUploadView } from "@/lib/platform/provisioning";
import { actionButtonPrimaryClass, actionButtonSecondaryClass } from "@/lib/ui/action-button";

/**
 * Ops view of the school data handover: mint a link, forward it, watch what
 * arrives, revoke when done.
 *
 * The URL shown after minting is the only time the token exists in clear — the
 * database stores a hash — so it is offered for copying immediately and cannot
 * be recovered later. Design: `weeon-tenants/docs/school-import.md`.
 */

const STATE_LABEL: Record<string, string> = {
  open: "Esperando archivos",
  used: "Recibido",
  expired: "Vencido",
  revoked: "Revocado",
  exhausted: "Recibido",
};

const STATE_TONE: Record<string, string> = {
  open: "bg-brand-500/10 text-brand-600 dark:text-brand-300",
  used: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  exhausted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expired: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  revoked: "bg-error/10 text-error",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Message Ops forwards to the school, so nobody has to improvise it. */
function schoolMessage(url: string, schoolName: string) {
  return `Hola, le compartimos el enlace para enviar los datos de ${schoolName} a Weeon. Ahí puede subir el archivo con estudiantes, encargados y docentes de su sistema actual. El enlace es personal y vence en 7 días: ${url}`;
}

export function OnboardingDataPanel({
  tenantId,
  schoolName,
}: {
  tenantId: string;
  schoolName: string;
}) {
  const [view, setView] = useState<OnboardingUploadView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const result = await loadOnboardingUploads(tenantId);
    setLoading(false);
    if (result.status === "error") {
      setError(result.error);
      return;
    }
    setError(null);
    setView(result.view);
  }, [tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function mint() {
    setBusy(true);
    setError(null);
    const result = await createUploadLinkAction({
      tenantId,
      label: label.trim() || null,
    });
    setBusy(false);
    if (result.status === "error") {
      setError(result.error);
      return;
    }
    setNewUrl(result.url);
    setLabel("");
    setCopied(false);
    void refresh();
  }

  async function revoke(linkId: string) {
    setBusy(true);
    const result = await revokeUploadLinkAction({ tenantId, linkId });
    setBusy(false);
    if (result.status === "error") {
      setError(result.error);
      return;
    }
    void refresh();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciónelo manualmente.");
    }
  }

  const links = view?.links ?? [];
  const files = view?.files ?? [];
  const open = links.filter((link) => link.state === "open");

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <Send className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Datos del colegio
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">
              Envíe un enlace al colegio para que suba su archivo de estudiantes,
              encargados y docentes. {files.length > 0 ? null : "Todavía no ha llegado nada."}
            </p>
          </div>
        </div>
      </header>

      {/* Minting form */}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
            Nota interna (opcional)
          </span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Lista inicial, periodo 1"
            maxLength={80}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
          />
        </label>
        <button
          type="button"
          onClick={() => void mint()}
          disabled={busy}
          className={actionButtonPrimaryClass()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Crear enlace
        </button>
      </div>

      {/* The token exists in clear only here. */}
      {newUrl ? (
        <div className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Check className="h-4 w-4 text-emerald-600" />
            Enlace creado. Cópielo ahora: no se puede volver a mostrar.
          </p>
          <code className="mt-2 block break-all rounded-lg bg-surface px-3 py-2 text-[12px] text-foreground/80">
            {newUrl}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copy(newUrl)}
              className={actionButtonSecondaryClass()}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Datos de ${schoolName} para Weeon`)}&body=${encodeURIComponent(schoolMessage(newUrl, schoolName))}`}
              className={actionButtonSecondaryClass()}
            >
              <Mail className="h-4 w-4" />
              Enviar por correo
            </a>
            <button
              type="button"
              onClick={() => setNewUrl(null)}
              className={actionButtonSecondaryClass()}
            >
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-error/25 bg-error/5 px-3 py-2 text-[13px] font-medium text-error"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {/* Received files */}
      {files.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
            Archivos recibidos
          </h3>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-3 py-2">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-foreground/40" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {file.fileName}
                </span>
                <span className="shrink-0 text-[11.5px] tabular-nums text-foreground/45">
                  {formatSize(file.byteSize)}
                </span>
                <span
                  className="shrink-0 text-[11.5px] text-foreground/40"
                  title={`sha256: ${file.sha256}`}
                >
                  {formatDate(file.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Links */}
      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
          Enlaces
        </h3>
        {loading ? (
          <p className="mt-2 flex items-center gap-2 text-[13px] text-foreground/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </p>
        ) : links.length === 0 ? (
          <p className="mt-2 text-[13px] text-foreground/50">
            Sin enlaces todavía. Cree uno y envíeselo al colegio.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {links.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center gap-2 py-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATE_TONE[link.state] ?? ""}`}
                >
                  {STATE_LABEL[link.state] ?? link.state}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/70">
                  {link.label || "Sin nota"}
                  <span className="ml-2 text-foreground/40">
                    {link.uploadCount}/{link.maxUploads} archivos · vence{" "}
                    {formatDate(link.expiresAt)}
                  </span>
                </span>
                {link.state === "open" ? (
                  <button
                    type="button"
                    onClick={() => void revoke(link.id)}
                    disabled={busy}
                    className="shrink-0 text-[11.5px] font-semibold text-error hover:underline"
                  >
                    Revocar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {open.length > 0 && files.length === 0 ? (
        <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-foreground/45">
          <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Los enlaces vencen solos a los 7 días. Recuerde borrar el archivo del
          colegio una vez importado.
        </p>
      ) : null}
    </section>
  );
}
