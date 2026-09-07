# Tathva '26 Admin Panel

Internal admin tool for the Tathva team. Next 16 (App Router), React 19, TypeScript, Tailwind
v4, axios.

## Running it

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the backend
npm run dev
```

`NEXT_PUBLIC_API_URL` is the backend **origin**, without `/api` — the client appends that
itself, so paths stay as `/admin/events`.

## Current state

The backend does not expose `/api/admin/*` yet, so **screens will show their error state**
("Could not reach the server", or a `404 NOT_FOUND` if the backend is running). That is
expected, not a bug. The request path, error parsing and every empty/error/loading state are
real and working — only the data is missing.

Auth is deliberately not implemented yet. `lib/api/client.ts` has a single interceptor that
will attach the bearer token when we get to it; nothing else reads a token.

## Layout

```
app/            routes — one folder per section, thin
components/
  layout/       AdminShell, Sidebar, Topbar, PageHeader
  ui/           Button, Input/Select/Textarea, Field, Badge, Card, Modal,
                Pagination, Spinner, EmptyState, ErrorState
  common/       DataTable, SearchInput, ConfirmDialog, StatusBadge
hooks/          useApi, useList, useMutation
lib/
  api/          client.ts (axios + helpers), errors.ts, one file per resource
  format.ts     paise ↔ rupees, ISO ↔ IST
  params.ts     URL string → typed query value
  nav.ts        sidebar sections
types/          contract types, mirroring admin-panel-frontend-api.md
```

## Adding a section

1. Add the resource module in `lib/api/`, using the `get` / `post` / `patch` / `del` helpers
   from `client.ts` — don't import axios directly:

   ```ts
   export const listVenues = (q: ListQuery) =>
     get<ListResponse<Venue>>("/admin/venues", { ...q });
   export const createVenue = (body: VenueInput) =>
     post<Venue>("/admin/venues", body, "venue");
   ```

   The third argument unwraps `{ "venue": { … } }`. List endpoints return
   `{ items, page, pageSize, total }` directly, so they don't need it.

2. Add the section to `NAV_ITEMS` in `lib/nav.ts` — one line, no edit to `Sidebar.tsx`.

3. Build the page with `useList` + `DataTable`, and forms with `useMutation` + `Field`.

## Things worth knowing

- **Money is integer paise.** Use `formatInr` / `rupeeInputToPaise` from `lib/format.ts`.
  Never `parseFloat(x) * 100` — `4.99 * 100` is `498.99999999999994`.
- **Dates go over the wire as ISO, and are shown in IST** regardless of the viewer's clock.
  `isoToDateTimeInput` / `dateTimeInputToIso` handle `<input type="datetime-local">`.
- **List state lives in the URL.** `useList` keeps page and filters in the query string, so a
  filtered view survives a reload and can be pasted to someone else.
- **`useSearchParams` needs a `<Suspense>` boundary** in Next 16 — wrap the client body of any
  page using `useList`.
- **A 422 populates `useMutation().fields`**, keyed by `details.issues[].path`. Pass the entry
  straight to `<Field error={…}>` and validation lands beside the right input.
- **Run `npx next typegen`** if `PageProps` / `LayoutProps` come up as unknown types; they are
  generated, not written by hand.

## Who's doing what

| | Satrajit | Partner |
| --- | --- | --- |
| Shared layer | client, types, errors, hooks, `components/ui`, shell | — |
| Sections | Events, Dashboard | Venues, Announcements, Users, Bookings |

One owner per section — don't edit a file in the other person's section. Shared files change by
asking, not editing, so we don't both touch the same lines.
