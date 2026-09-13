"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";

export interface RowAction {
  label: string;
  onClick: () => void;
  /**
   * Greys the item out. Prefer this over hiding an action — a disabled
   * "Publish" tells you the row is already published, whereas an absent one
   * tells you nothing.
   */
  disabled?: boolean;
  /** Why it is disabled. Surfaced as a tooltip so the grey is not a dead end. */
  disabledReason?: string;
  destructive?: boolean;
}

/** The three-dot row menu shared by events and announcements. */
export default function RowActionsMenu({
  actions,
  busy = false,
  label = "Row actions",
}: {
  actions: RowAction[];
  busy?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-7 w-7 p-0"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {actions.map((action) => {
            const disabled = busy || action.disabled;

            return (
              // A disabled button swallows pointer events, so the tooltip lives
              // on the wrapper or it would never appear.
              <span
                key={action.label}
                title={
                  action.disabled ? action.disabledReason : undefined
                }
                className="block"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={disabled}
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                  className={`flex w-full items-center px-3 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                    action.destructive
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {action.label}
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
