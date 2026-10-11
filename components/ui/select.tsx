"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  controlFieldGap,
  controlLabelClass,
  controlShellClass,
  type ControlSize,
} from "@/components/ui/control-classes";

export interface SelectOption {
  value: string;
  label: string;
  triggerLabel?: string;
}

interface SelectProps {
  label: string;
  id?: string;
  ariaLabel?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  menuClassName?: string;
  size?: ControlSize;
  className?: string;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-foreground/45 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Custom listbox select — same interaction model as `weeon-tenants/components/ui/select`.
 * Do not use native `<select>` for new Ops UI; it breaks focus rings, menu styling, and a11y parity.
 */
export function Select({
  label,
  id,
  ariaLabel,
  options,
  value,
  onChange,
  placeholder = "Select…",
  error,
  hint,
  required,
  disabled,
  menuClassName,
  size = "sm",
  className,
}: SelectProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.triggerLabel ?? selected?.label;

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function openMenu() {
    if (disabled) return;
    const selectedIndex = options.findIndex((o) => o.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function toggleMenu() {
    if (open) closeMenu();
    else openMenu();
  }

  function selectOption(optionValue: string) {
    onChange(optionValue);
    closeMenu();
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    const frame = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", onPointerDown);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openMenu();
        else if (event.key === "ArrowDown") {
          setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        } else if (event.key === "ArrowUp") {
          setActiveIndex((i) => Math.max(i - 1, 0));
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeMenu();
        }
        break;
      case "Tab":
        closeMenu();
        break;
    }
  }

  function onListboxKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeIndex >= 0 && options[activeIndex]) {
          selectOption(options[activeIndex].value);
        }
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        buttonRef.current?.focus();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  }

  const triggerClass = [
    "flex w-full min-w-0 items-center justify-between border outline-none transition-[color,box-shadow,border-color,background-color]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/15",
    controlShellClass(size),
    size === "md" ? "gap-2" : "gap-1.5",
    error
      ? "border-error bg-error-subtle/30 focus-visible:border-error focus-visible:ring-error/20"
      : open
        ? "border-brand-500 bg-surface ring-[3px] ring-brand-500/15"
        : selected
          ? "border-border bg-surface shadow-sm shadow-black/[0.03] hover:border-border-strong dark:shadow-black/20"
          : "border-border bg-surface-muted/35 shadow-sm shadow-black/[0.03] hover:border-border-strong hover:bg-surface dark:shadow-black/20",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={rootRef}
      className={`relative flex min-w-0 flex-col ${controlFieldGap(size)} ${className ?? ""}`}
    >
      {label ? (
        <span id={`${inputId}-label`} className={controlLabelClass(size)}>
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </span>
      ) : (
        <span className="sr-only" id={`${inputId}-label`}>
          {ariaLabel ?? "Select"}
        </span>
      )}

      <div className="relative min-w-0">
        <button
          ref={buttonRef}
          type="button"
          id={inputId}
          disabled={disabled}
          onClick={toggleMenu}
          onKeyDown={onButtonKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-labelledby={`${inputId}-label`}
          aria-label={label ? undefined : ariaLabel}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={triggerClass}
        >
          <span
            className={`min-w-0 flex-1 truncate text-left ${selected ? "font-medium text-foreground" : "text-foreground/45"}`}
          >
            {selected ? displayLabel : placeholder}
          </span>
          <Chevron open={open} />
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${inputId}-label`}
            aria-activedescendant={
              activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined
            }
            onKeyDown={onListboxKeyDown}
            onPointerDown={(event) => event.stopPropagation()}
            className={`shadow-elevated absolute top-[calc(100%+4px)] z-[200] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-1 ${
              menuClassName ?? "left-0 w-full min-w-full"
            }`}
            style={{
              maxHeight: `min(20rem, ${Math.max(options.length, 1) * 2.75 + 0.75}rem)`,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value}
                  id={`${inputId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.value)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-200"
                      : isActive
                        ? "bg-surface-muted text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                  }`}
                >
                  <span className="min-w-0 break-words text-left leading-snug">{option.label}</span>
                  {isSelected && (
                    <svg
                      aria-hidden
                      className="ml-auto shrink-0 text-brand-600 dark:text-brand-300"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-foreground/50">No options</li>
            )}
          </ul>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs font-medium text-foreground/50">{hint}</p>
      )}

      {error && (
        <p id={`${inputId}-error`} role="alert" className="flex items-center gap-1 text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
