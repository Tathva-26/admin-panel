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

Open [http://localhost:3000](http://localhost:3000). The backend must be running — there is
no offline mode.

### Environment

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend origin, without `/api` — the client appends it. Required for `next build`; `next dev` falls back to `http://localhost:5000`. |
| `NEXT_PUBLIC_PAYMENT_EXPIRY_MINUTES` | How long a booking may sit pending before it reads as timed out. Must match `PAYMENT_EXPIRY_MINUTES` in the backend. Defaults to 30. |

Sign-in is Google OAuth through the backend. The panel asks the backend to return the token
to `<origin>/auth/callback`, so that origin must be listed in the backend's `CORS_ORIGIN`.
Admin access is decided by the role on the account, not by anything in the frontend.

## Sections

| Section | What it does |
| --- | --- |
| Dashboard | Counts across the fest, plus events that need attention |
| Events | Create, edit, publish and unpublish events |
| Venues | Places an event can be scheduled at, and what is on at each |
| Announcements | Notices shown on the public site once published |
| Users | Registered users and their roles |
| Bookings | Event and accommodation bookings, and their payment state |
| Contact | Enquiries sent from the public site, and how they were handled |

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
```

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

## API

The panel talks to the Tathva backend over REST. Endpoint shapes are mirrored as types in
`types/index.ts`.

All requests go through `lib/api/client.ts`, which handles the base URL, auth header and
error parsing. Resource modules in `lib/api/` use its helpers rather than importing axios
directly.

Two conventions the API expects and the UI relies on: money is an integer number of paise,
and dates cross the wire as ISO timestamps while displaying in IST. `lib/format.ts` has the
conversions — use them rather than converting inline.
