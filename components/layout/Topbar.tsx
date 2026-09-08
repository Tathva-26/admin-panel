"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Topbar({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6">
      {/* Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden border border-zinc-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900">
          Dashboard
        </h1>
      </div>

      {/* Header Actions: Search, Add Event, Bell, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search Bar */}
        <button
          type="button"
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2.5 w-48 md:w-64 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 hover:bg-white hover:border-zinc-300 transition-all text-left"
        >
          <svg className="h-4 w-4 text-zinc-400 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13 13l4 4" strokeLinecap="round" />
          </svg>
          <span className="truncate">Search event or anything</span>
        </button>

        {/* Solid Rectangular Primary Action: Add Event */}
        <Link
          href="/events?new=true"
          onClick={() => {
            if (typeof window !== "undefined" && window.location.pathname === "/events") {
              window.dispatchEvent(new CustomEvent("open-create-event"));
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-black px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors shrink-0"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Event</span>
        </Link>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 shrink-0 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-600" />
        </button>

        {/* User Profile Box */}
        {user ? (
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-bold text-zinc-900 max-w-[120px] truncate">
              {user.name}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}


