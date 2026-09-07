"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { listEvents } from "@/lib/api/events";
import { NAV_ITEMS } from "@/lib/nav";
import type { AdminEvent } from "@/types";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
}

const SEARCH_DEBOUNCE_MS = 200;
const MIN_SEARCH_LENGTH = 2;
const MAX_EVENT_RESULTS = 5;

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [events, setEvents] = useState<AdminEvent[]>([]);

  // Cmd+K on a Mac, Ctrl+K everywhere else. Registered once, globally.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Event lookup, debounced. Everything sets state from inside the timeout
  // rather than the effect body, which React 19's lint rules require.
  useEffect(() => {
    if (!open) return;

    let active = true;
    const term = query.trim();

    const timer = setTimeout(async () => {
      if (term.length < MIN_SEARCH_LENGTH) {
        if (active) setEvents([]);
        return;
      }

      try {
        const result = await listEvents({
          search: term,
          pageSize: MAX_EVENT_RESULTS,
        });
        if (active) setEvents(result.items);
      } catch {
        // The palette is a convenience; a failed lookup just shows no events
        // rather than an error the user did not ask for.
        if (active) setEvents([]);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) return null;

  const term = query.trim().toLowerCase();

  const items: PaletteItem[] = [
    ...NAV_ITEMS.filter((nav) => nav.label.toLowerCase().includes(term)).map(
      (nav) => ({
        id: `nav:${nav.href}`,
        label: nav.label,
        hint: nav.description,
        group: "Go to",
        href: nav.href,
      }),
    ),
    ...events.map((event) => ({
      id: `event:${event.id}`,
      label: event.heading,
      hint: event.published ? "Published" : "Draft",
      group: "Events",
      // No event detail route yet, so this filters the list down to it.
      href: `/events?search=${encodeURIComponent(event.heading)}`,
    })),
  ];

  // Clamped rather than reset in an effect, so results changing under the
  // cursor cannot leave the selection pointing past the end of the list.
  const active = Math.min(activeIndex, Math.max(items.length - 1, 0));

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
    setEvents([]);
  };

  const go = (item: PaletteItem | undefined) => {
    if (!item) return;
    router.push(item.href);
    close();
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(items.length === 0 ? 0 : (active + 1) % items.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        items.length === 0 ? 0 : (active - 1 + items.length) % items.length,
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(items[active]);
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-zinc-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Search sections and events…"
          className="w-full shrink-0 border-b border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Nothing matches “{query}”.
          </p>
        ) : (
          <ul className="overflow-y-auto py-1">
            {items.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;

              return (
                <li key={item.id}>
                  {showGroup ? (
                    <p className="px-4 pt-2 pb-1 text-[11px] tracking-wide text-zinc-400 uppercase">
                      {item.group}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-4 py-2 text-left",
                      index === active ? "bg-zinc-100" : "hover:bg-zinc-50",
                    )}
                  >
                    <span className="truncate text-sm text-zinc-900">
                      {item.label}
                    </span>
                    {item.hint ? (
                      <span className="ml-auto shrink-0 text-xs text-zinc-400">
                        {item.hint}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="shrink-0 border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400">
          ↑↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  );
}
