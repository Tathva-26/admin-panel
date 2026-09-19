# Event regression checks

The event form submits JSON when no image is selected and multipart `data` JSON plus an actual `image` File when one is selected. It uses the existing authenticated backend create/update routes. Set `NEXT_PUBLIC_API_URL` to the backend origin, without `/api`; `.env.example` shows port 8000 for ordinary development.

## Browser suite

Start the sibling backend's `tests/serve-events.js` against an isolated PostgreSQL schema as documented in `backend_v2/EVENTS_FIX_REPORT.md`. The test API runs on `http://localhost:5000` and replaces only session lookup for tests. R2 is not mocked; missing credentials must produce a genuine failed save.

Build explicitly for that test API, then run:

```powershell
$env:NEXT_PUBLIC_API_URL='http://localhost:5000'
npm ci
npx playwright install chromium
npm run build
npm run lint
npx tsc --noEmit
npm test
```

Playwright starts/stops the production Next server on port 3000. It tests create/list/reload, zero price, payload names, filtering, editing without changing the picture/timestamp, invalid and oversized files, field validation, file preview, generated multipart boundaries, actual R2 failures, image-only replacement, and create/update error messages. Successful saves use real PostgreSQL. Failure-only browser routes inject HTTP 500 to verify presentation; successful R2 uploads are never faked.

The backend contains an opt-in real R2/CDN success test (`TEST_R2_UPLOADS=1`) for use with a configured test bucket. These browser tests specifically expect the fixture's missing-R2 behavior and should be run without that flag.

After testing, rebuild with your intended `NEXT_PUBLIC_API_URL` before using the build for ordinary development/deployment; Next public environment variables are fixed at build time. The test API/session fixture is not part of the production server.

## Admin-panel checks with real configuration

1. Sign in as ADMIN and open Events -> New event. Enter Heading/Date, leave the picture empty, and create. The draft appears immediately and survives reload.
2. Create another event with a valid PNG/JPEG/WebP. Check the local preview, save, reload and reopen Edit to verify the uploaded image.
3. Edit without choosing a replacement; the stored image and untouched timestamps remain.
4. Edit, choose a replacement, and save. Reopen after reload to verify the replacement. Use Keep current image to cancel the pending selection.
5. Try an invalid or oversized file and a failing storage request. The modal stays open and shows an error; an existing image remains intact.

Match `NEXT_PUBLIC_EVENT_IMAGE_MAX_MB` to backend `IMAGE_MAX_MB` (default 2). A working R2 bucket, credentials and public CDN URL are needed for successful uploads.
