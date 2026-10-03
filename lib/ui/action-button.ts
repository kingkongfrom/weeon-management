import { cn } from "@/lib/cn";

/** Standard action control — same height across tenant, teachers, and Ops web apps. */
export const ACTION_BUTTON_BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

export function actionButtonPrimaryClass(className?: string) {
  return cn(
    ACTION_BUTTON_BASE,
    "border border-brand-600 bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.99]",
    className,
  );
}

export function actionButtonSecondaryClass(className?: string) {
  return cn(
    ACTION_BUTTON_BASE,
    "border border-border bg-surface text-foreground/70 hover:bg-surface-muted",
    className,
  );
}

export function actionButtonDangerClass(className?: string) {
  return cn(
    ACTION_BUTTON_BASE,
    "bg-error text-white hover:opacity-90",
    className,
  );
}

export const ACTION_NAV_LINK =
  "inline-flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors";
