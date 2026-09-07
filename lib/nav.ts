/**
 * Sidebar navigation, kept as data rather than markup.
 *
 * Adding a section is a one-line append here instead of an edit to
 * Sidebar.tsx — which matters while two of us are working in the same repo.
 */

export interface NavItem {
  href: string;
  label: string;
  /** Shown under the page title. Keep it to one short line. */
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Counts across events, announcements, users and bookings.",
  },
  {
    href: "/events",
    label: "Events",
    description: "Workshops, lectures, competitions and general events.",
  },
  {
    href: "/venues",
    label: "Venues",
    description: "Places an event can be scheduled at.",
  },
  {
    href: "/announcements",
    label: "Announcements",
    description: "Notices shown on the public site once published.",
  },
  {
    href: "/users",
    label: "Users",
    description: "Registered users and their roles.",
  },
  {
    href: "/bookings",
    label: "Bookings",
    description: "Event and accommodation bookings, and their payment state.",
  },
];

/**
 * Looks up a section so a page can reuse its label and description instead of
 * restating them. Throws rather than returning undefined: a miss here is a typo
 * in a literal, which should fail loudly the first time the page renders.
 */
export function getNavItem(href: string): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.href === href);
  if (!item) throw new Error(`No nav item registered for "${href}"`);
  return item;
}
