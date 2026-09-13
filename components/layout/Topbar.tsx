"use client";

import Link from "next/link";

import Avatar from "@/components/common/Avatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { roleLabel } from "@/lib/labels";

/**
 * Deliberately carries no page title.
 *
 * Every section renders its own <h1> through PageHeader, so a title here would
 * be a second, competing heading — which is what it was, hardcoded to
 * "Dashboard" on all six pages.
 *
 * It also carries no page actions. "New event" belongs on the events page, not
 * on bookings.
 */
export default function Topbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onSearchClick}
        className="flex items-center gap-2.5 rounded-md border border-border bg-muted px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-input hover:bg-card sm:w-64"
      >
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13 13l4 4" strokeLinecap="round" />
        </svg>
        <span className="hidden truncate sm:inline">Search events, people…</span>
        {/* Advertises the palette that already exists. */}
        <kbd className="numeric ml-auto hidden rounded border border-border bg-card px-1 text-[11px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-input hover:bg-muted"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {user ? (
          // A link, not a div. It looked pressable and did nothing, which is a
          // worse offence than not looking pressable at all.
          <Link
            href="/profile"
            aria-label="Your profile"
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card py-1 pr-2.5 pl-1 transition-colors hover:border-input hover:bg-muted"
          >
            <Avatar name={user.name} seed={user.email} className="h-6 w-6" />
            {/* Truncated, so a long name cannot push the chip off the bar. The
                full name is readable on the profile page. */}
            <div className="hidden min-w-0 md:block">
              <p className="max-w-35 truncate text-xs font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-[11px] text-muted-foreground">{roleLabel(user.role)}</p>
            </div>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
