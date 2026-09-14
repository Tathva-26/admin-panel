"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type Choice = "light" | "dark" | "system";

const NEXT: Record<Choice, Choice> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<Choice, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const noop = () => () => {};

/**
 * True only after hydration.
 *
 * The stored theme lives in localStorage, so the first client render must match
 * the server's. `useSyncExternalStore` provides a separate server snapshot,
 * avoiding a setState-in-an-effect.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Cycles light → dark → system.
 *
 * A three-way cycle rather than a two-way switch because "follow the OS" is a
 * real preference, and a plain toggle silently drops it the first time you use it.
 */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hydrated = useHydrated();

  const current = (theme as Choice) ?? "system";

  // A placeholder of the same size, so the topbar does not reflow on hydration.
  if (!hydrated) {
    return <div className="h-8 w-8 shrink-0" aria-hidden="true" />;
  }

  const showingDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[current])}
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[NEXT[current]]}.`}
      title={`Theme: ${LABEL[current]}`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-secondary"
    >
      {showingDark ? (
        // Moon
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            d="M16 11.5A6.5 6.5 0 0 1 8.5 4a6.5 6.5 0 1 0 7.5 7.5Z"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Sun
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="3.5" />
          <path
            d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.7 4.3l-1 1M5.3 14.7l-1 1M15.7 15.7l-1-1M5.3 5.3l-1-1"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* The icon shows the active appearance; screen readers get the mode. */}
      <span className="sr-only">{LABEL[current]}</span>
    </button>
  );
}
