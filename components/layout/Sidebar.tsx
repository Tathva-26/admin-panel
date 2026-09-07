"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarProps {
  /** Drawer state on mobile. Ignored from `lg` up, where the rail is always in. */
  open: boolean;
  /** Closes the drawer — also called when a link is followed. */
  onNavigate: () => void;
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/*
        Scrim, mobile only. Closing on tap is the expected gesture, and it also
        gives the drawer a click-outside target without a focus trap.
      */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onNavigate}
          className="fixed inset-0 z-30 cursor-default bg-zinc-900/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white",
          // Mobile: slides in over the content. Desktop: part of the row.
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Tathva &rsquo;26
            <span className="ml-1.5 font-normal text-zinc-400">Admin</span>
          </span>

          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="-mr-1 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors lg:py-1.5",
                      active
                        ? "bg-zinc-100 font-medium text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
