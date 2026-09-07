"use client";

import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

function apiTargetLabel(origin: string): string | null {
  try {
    const { hostname, port } = new URL(origin);

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `local:${port || "80"}`;
    }
    if (/staging|dev|test/i.test(hostname)) return hostname;

    return null;
  } catch {
    return origin;
  }
}

export default function Topbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const { user, logout } = useAuth();
  const target = apiTargetLabel(
    process.env.NEXT_PUBLIC_API_URL ?? "",
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

      <button
        type="button"
        onClick={onSearchClick}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13 13l4 4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="numeric hidden rounded border border-zinc-200 bg-zinc-50 px-1 text-[11px] text-zinc-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {target ? (
        <span
          title={process.env.NEXT_PUBLIC_API_URL}
          className="numeric hidden rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500 sm:inline"
        >
          {target}
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-zinc-900">
                  {user.name}
                </span>
                <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{user.email}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="text-xs"
            >
              Sign Out
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
