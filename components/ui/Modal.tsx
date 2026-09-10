"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons for the bottom row. */
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Where focus came from, so it can be handed back on close rather than
    // dumped at the top of the document.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((node) => node.offsetParent !== null);

    // Focus the first control rather than leaving it on whatever opened the
    // dialog, which is behind the overlay and unreachable.
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      /*
       * Tab was escaping to the page behind the overlay — visually covered,
       * still focusable, and impossible to see where the cursor had gone. This
       * cycles focus within the dialog instead.
       */
      if (event.key !== "Tab") return;

      const nodes = focusable();
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes.at(-1)!;
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind the overlay scrolling with the wheel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-zinc-900/40"
      />

      {/*
        Capped to the viewport with the body scrolling, so a long form on a
        phone cannot push its own buttons off screen.
      */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-md border border-zinc-200 bg-white shadow-lg"
      >
        <div className="shrink-0 border-b border-zinc-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>

        {children ? (
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-200 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
