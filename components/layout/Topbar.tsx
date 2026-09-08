"use client";

import Avatar from "@/components/common/Avatar";
import { useAuth } from "@/context/AuthContext";

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

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
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
        className="flex items-center gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white sm:w-64"
      >
        <svg
          className="h-4 w-4 shrink-0 text-zinc-400"
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
        <kbd className="numeric ml-auto hidden rounded border border-zinc-200 bg-white px-1 text-[11px] text-zinc-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {user ? (
        <div className="ml-auto flex shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white py-1 pr-2.5 pl-1">
          <Avatar name={user.name} seed={user.email} className="h-6 w-6" />
          <div className="hidden min-w-0 md:block">
            <p className="max-w-35 truncate text-xs font-semibold text-zinc-900">
              {user.name}
            </p>
            <p className="max-w-35 truncate text-[11px] text-zinc-500">
              {user.role}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
