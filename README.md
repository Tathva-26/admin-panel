# Tathva '26 Admin Panel

Internal admin tool for the Tathva team. Manage events, venues, announcements, users and
bookings for the fest.

Built with Next 16 (App Router), React 19, TypeScript, Tailwind v4 and axios.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend origin, without `/api` — the API
client appends that itself. Auth is cookie-only (better-auth session on the backend), so the
backend must allow this origin with credentials (CORS `Access-Control-Allow-Credentials`) and
trust it as a better-auth origin.

For temporary frontend-only work, set `NEXT_PUBLIC_MOCK_AUTH=true` in `.env.local`.
This enables the temporary mock admin login and the in-memory data in `api/` for events,
venues, announcements, users, bookings and dashboard stats. Mock changes reset on reload.
Remove that variable to return to the real backend.

## Sections

| Section | What it does |
| --- | --- |
| Dashboard | Counts across the fest, plus events that need attention |
| Events | Create, edit, publish and archive events |
| Venues | Places an event can be scheduled at, and what is on at each |
| Announcements | Notices shown on the public site once published |
| Users | Registered users and their roles |
| Bookings | Event and accommodation bookings, and their payment state |

Sign-in is Google OAuth through the backend; admin access is decided by the role on the
account, not by anything in the frontend.

## Project structure

```
app/            routes, one folder per section
components/
  layout/       shell, sidebar, topbar
  ui/           buttons, inputs, badges, modals
  common/       data table, search, dialogs, command palette
  <section>/    screens for one section
context/        auth session
hooks/          data fetching, list state, mutations, CSV export
lib/
  api/          axios client and one module per resource
  format.ts     money and date formatting
  schedule.ts   what is on at a venue, and when
  attention.ts  dashboard checks for events needing review
types/          API types
api/            temporary in-memory mock data and request handler
```

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

## API

The panel talks to the Tathva backend over REST. Endpoint shapes are documented in
`admin-panel-frontend-api.md`, and mirrored as types in `types/index.ts`.

All requests go through `lib/api/client.ts`, which handles the base URL, auth header and
error parsing. Resource modules in `lib/api/` use its helpers rather than importing axios
directly.

Two conventions the API expects and the UI relies on: money is an integer number of paise,
and dates cross the wire as ISO timestamps while displaying in IST. `lib/format.ts` has the
conversions — use them rather than converting inline.
