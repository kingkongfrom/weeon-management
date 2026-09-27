"use client";

import { useActionState } from "react";
import { Check, Loader2, Lock, Sparkles } from "lucide-react";
import {
  setTenantModuleAction,
  type TenantModuleActionState,
} from "@/lib/dashboard/tenant-module-actions";
import { cn } from "@/lib/cn";
import type { TenantModuleState } from "@/lib/platform/tenant-modules";

const MODULE_ICON: Record<string, string> = {
  grades: "✓",
  aula_virtual: "▤",
  attendance: "▦",
  agenda: "▥",
  communication: "✉",
  gallery: "❏",
  administration: "⚙",
  parent_payments: "$",
};

/**
 * Module control for the Ops School page.
 *
 * Core modules are the plan minimum — always on, shown as one compact band.
 * Paid add-ons are the interactive part: a switch per module with live status.
 */
export function ModuleListCard({
  tenantId,
  modules,
}: {
  tenantId: string;
  modules: TenantModuleState[];
}) {
  const core = modules.filter((module) => module.tier === "core");
  const addons = modules.filter((module) => module.tier === "addon");
  const enabledAddons = addons.filter((module) => module.enabled).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-icon-accent-bg text-icon-accent-fg"
          aria-hidden
        >
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Add-ons
          </h2>
          <p className="mt-0.5 text-xs font-medium text-foreground/50">
            Optional paid modules — switch on or off per school.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold tabular-nums text-foreground/55">
          {enabledAddons}/{addons.length}
        </span>
      </div>

      {addons.length === 0 ? (
        <p className="border-t border-border/70 px-4 py-4 text-sm font-medium text-foreground/45 sm:px-5">
          No paid add-ons available yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 border-t border-border/70">
          {addons.map((module) => (
            <AddonRow key={module.key} tenantId={tenantId} module={module} />
          ))}
        </ul>
      )}

      <div className="border-t border-border/70 bg-surface-muted/40 px-4 py-3 sm:px-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
          <Lock size={11} aria-hidden />
          Included in every plan
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {core.map((module) => (
            <li
              key={module.key}
              title={module.description}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pr-3 pl-1.5 text-xs font-semibold text-foreground/75"
            >
              <span
                className="grid h-5 w-5 place-items-center rounded-full bg-icon-brand-bg text-[10px] text-icon-brand-fg"
                aria-hidden
              >
                {MODULE_ICON[module.key] ?? "•"}
              </span>
              {module.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AddonRow({
  tenantId,
  module,
}: {
  tenantId: string;
  module: TenantModuleState;
}) {
  const [state, action, pending] = useActionState<
    TenantModuleActionState,
    FormData
  >(setTenantModuleAction, null);

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3.5 transition-colors sm:px-5",
        module.enabled ? "bg-success-subtle/40" : "hover:bg-surface-muted/40",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold",
            module.enabled
              ? "bg-accent text-white"
              : "bg-surface-muted text-foreground/45",
          )}
          aria-hidden
        >
          {MODULE_ICON[module.key] ?? "•"}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {module.label}
          </p>
          <p className="mt-0.5 text-xs text-foreground/55">{module.description}</p>
          {module.enabled && module.enabledAt ? (
            <p className="mt-0.5 text-[11px] font-medium text-success">
              Enabled {new Date(module.enabledAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <form action={action}>
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="moduleKey" value={module.key} />
          <input type="hidden" name="label" value={module.label} />
          <input
            type="hidden"
            name="enabled"
            value={module.enabled ? "false" : "true"}
          />
          <button
            type="submit"
            role="switch"
            aria-checked={module.enabled}
            disabled={pending}
            aria-label={`${module.enabled ? "Disable" : "Enable"} ${module.label}`}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-brand-500/15 disabled:opacity-60 motion-reduce:transition-none"
          >
            <span
              className={`absolute inset-0 rounded-full transition-colors ${
                module.enabled
                  ? "brand-gradient"
                  : "bg-surface-muted ring-1 ring-inset ring-border-strong"
              }`}
              aria-hidden
            />
            <span
              className={`relative z-10 grid h-5 w-5 place-items-center rounded-full bg-white transition-transform duration-200 ease-out ${
                module.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            >
              {pending ? (
                <Loader2 size={12} className="animate-spin text-foreground/50" />
              ) : null}
            </span>
          </button>
        </form>
        {state?.ok ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
            <Check size={11} />
            Saved
          </span>
        ) : null}
        {state?.error ? (
          <span className="max-w-[12rem] text-right text-[11px] font-semibold text-error">
            {state.error}
          </span>
        ) : null}
      </div>
    </li>
  );
}
