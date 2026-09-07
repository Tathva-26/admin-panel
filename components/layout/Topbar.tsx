"use client";

/**
 * Deliberately not a copy of the page title — that lives in PageHeader.
 *
 * What is actually useful in the chrome of an internal tool is knowing which
 * backend you are pointed at, since that is the first question when a screen
 * is empty. On a phone that is noise, so it drops away and the menu button
 * takes the space.
 */
export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs whitespace-nowrap text-amber-700">
          Auth disabled
        </span>
        <span className="numeric hidden text-xs text-zinc-500 sm:inline">
          {apiOrigin}/api
        </span>
      </div>
    </header>
  );
}
