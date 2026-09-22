"use client";

export function StatusSwitch({
  checked,
  onCheckedChange,
  showLabel = true,
  labelOn = "On",
  labelOff = "Off",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showLabel?: boolean;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/15"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-all ${
          checked
            ? "brand-gradient "
            : "bg-surface-muted ring-1 ring-inset ring-border-strong"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      {showLabel ? (
        <span
          className={`text-sm font-semibold transition-colors ${
            checked ? "text-brand-700 dark:text-brand-300" : "text-foreground/50"
          }`}
        >
          {checked ? labelOn : labelOff}
        </span>
      ) : null}
    </button>
  );
}
