"use client";

/**
 * Which backend the panel is talking to is the first question when a screen
 * comes up empty, so it is worth showing — but only when it is not the real
 * one. Pointed at production this renders nothing, which is the common case
 * and should be quiet.
 */
function apiTargetLabel(origin: string): string | null {
  try {
    const { hostname, port } = new URL(origin);

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `local:${port || "80"}`;
    }
    if (/staging|dev|test/i.test(hostname)) return hostname;

    return null;
  } catch {
    // A malformed value is worth surfacing rather than swallowing.
    return origin;
  }
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const target = apiTargetLabel(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  );

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

      {target ? (
        <span
          title={process.env.NEXT_PUBLIC_API_URL}
          className="numeric ml-auto hidden rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500 sm:inline"
        >
          {target}
        </span>
      ) : null}
    </header>
  );
}
