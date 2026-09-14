"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { listAnnouncements } from "@/lib/api/announcements";
import { listBookings } from "@/lib/api/bookings";
import { listContactMessages } from "@/lib/api/contact";
import { listEvents } from "@/lib/api/events";
import { listUsers } from "@/lib/api/users";
import { listVenues } from "@/lib/api/venues";
import { formatInr } from "@/lib/format";
import {
  bookingStatusLabel,
  contactStatusLabel,
  eventTypeLabel,
} from "@/lib/labels";
import { NAV_ITEMS } from "@/lib/nav";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
}

const SEARCH_DEBOUNCE_MS = 200;
const MIN_SEARCH_LENGTH = 2;

/** Per resource. Enough to find the thing, few enough to still scan the list. */
const MAX_PER_GROUP = 4;
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const [results, setResults] = useState<PaletteItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
    setResults([]);
    setSearching(false);
  }, [onOpenChange]);

  // Cmd+K on a Mac, Ctrl+K everywhere else. Registered once, globally.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else onOpenChange(true);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, onOpenChange, open]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((node) => node.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1)!;
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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  /*
   * Searches every resource at once, not just events — the button says "search
   * anything", and typing a person's name finding nothing is worse than not
   * offering it.
   *
   * allSettled, so one failing endpoint (bookings, say, before its routes
   * exist) still lets the others return. The palette is a convenience; it
   * degrades rather than erroring.
   */
  useEffect(() => {
    if (!open) return;

    let active = true;
    const term = query.trim();

    const timer = setTimeout(async () => {
      if (term.length < MIN_SEARCH_LENGTH) {
        if (active) {
          setResults([]);
          setSearching(false);
        }
        return;
      }

      if (active) setSearching(true);

      const [events, users, venues, announcements, bookings, contacts] =
        await Promise.allSettled([
          listEvents({ search: term, pageSize: MAX_PER_GROUP }),
          listUsers({ search: term, pageSize: MAX_PER_GROUP }),
          listVenues({ search: term, pageSize: MAX_PER_GROUP }),
          listAnnouncements({ search: term, pageSize: MAX_PER_GROUP }),
          listBookings({ search: term, pageSize: MAX_PER_GROUP }),
          listContactMessages({ search: term, pageSize: MAX_PER_GROUP }),
        ]);

      if (!active) return;

      const next: PaletteItem[] = [];

      if (events.status === "fulfilled") {
        for (const event of events.value.items) {
          next.push({
            id: `event:${event.id}`,
            label: event.heading,
            hint: `${eventTypeLabel(event.type)} · ${event.published ? "Published" : "Draft"}`,
            group: "Events",
            href: `/events?eventId=${event.id}`,
          });
        }
      }

      if (users.status === "fulfilled") {
        for (const user of users.value.items) {
          next.push({
            id: `user:${user.id}`,
            label: user.name,
            hint: user.email,
            group: "People",
            href: `/users?search=${encodeURIComponent(user.email)}`,
          });
        }
      }

      if (venues.status === "fulfilled") {
        for (const venue of venues.value.items) {
          next.push({
            id: `venue:${venue.id}`,
            label: venue.name,
            hint: venue.address ?? undefined,
            group: "Venues",
            href: `/venues?search=${encodeURIComponent(venue.name)}`,
          });
        }
      }

      if (announcements.status === "fulfilled") {
        for (const announcement of announcements.value.items) {
          next.push({
            id: `announcement:${announcement.id}`,
            label: announcement.title,
            hint: announcement.published ? "Published" : "Draft",
            group: "Announcements",
            href: `/announcements?search=${encodeURIComponent(announcement.title)}`,
          });
        }
      }

      if (bookings.status === "fulfilled") {
        for (const booking of bookings.value.items) {
          next.push({
            id: `booking:${booking.bookingUid}`,
            label: booking.bookingUid,
            hint: [
              booking.user?.name,
              formatInr(booking.amountTotal),
              bookingStatusLabel(booking.status),
            ]
              .filter(Boolean)
              .join(" · "),
            group: "Bookings",
            href: `/bookings?search=${encodeURIComponent(booking.bookingUid)}`,
          });
        }
      }

      if (contacts.status === "fulfilled") {
        for (const contact of contacts.value.items) {
          next.push({
            id: `contact:${contact.id}`,
            label: contact.topic,
            hint: [contact.name, contactStatusLabel(contact.status)]
              .filter(Boolean)
              .join(" · "),
            group: "Contact",
            href: `/contact-messages?search=${encodeURIComponent(contact.name)}`,
          });
        }
      }

      setResults(next);
      setSearching(false);
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
    ...results,
  ];

  // Clamped rather than reset in an effect, so results changing under the
  // cursor cannot leave the selection pointing past the end of the list.
  const active = Math.min(activeIndex, Math.max(items.length - 1, 0));

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

  // Without this it would claim nothing matched while still looking.
  let emptyMessage: string;
  if (searching) {
    emptyMessage = "Searching…";
  } else if (query.trim().length < MIN_SEARCH_LENGTH) {
    emptyMessage =
      "Type to search events, people, venues, announcements and bookings.";
  } else {
    emptyMessage = `Nothing matches “${query}”.`;
  }

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-background/80"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Search events, people, venues, bookings…"
          className="w-full shrink-0 border-b border-border px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="overflow-y-auto py-1">
            {items.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;

              return (
                <li key={item.id}>
                  {showGroup ? (
                    <p className="px-4 pt-2 pb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                      {item.group}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-4 py-2 text-left",
                      index === active ? "bg-muted" : "hover:bg-muted",
                    )}
                  >
                    <span className="truncate text-sm text-foreground">
                      {item.label}
                    </span>
                    {item.hint ? (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {item.hint}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

                    <p className="shrink-0 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          ↑↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  );
}
