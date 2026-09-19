import { test, expect, type Page } from '@playwright/test';

const API = 'http://localhost:5000/api';
const prefix = `Browser regression ${Date.now()}`;
// Valid PNG; uploaded through the real backend processing pipeline.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=', 'base64');

async function fillNew(page: Page, name: string) {
  await page.goto('/events?new=true');
  await page.getByLabel('Heading').fill(name);
  await page.getByLabel('Date', { exact: false }).fill('2026-10-24');
}

test('create a free draft resets filters/page, appears immediately and survives reload', async ({ page }) => {
  const name = `${prefix} free draft`;
  await page.goto('/events?published=true&type=lectures&search=doesnotmatch&page=5&new=true');
  await page.getByLabel('Heading').fill(name);
  await page.getByLabel('Date', { exact: false }).fill('2026-10-24');
  await page.getByLabel('Tickets remaining').fill('25');
  const sent = page.waitForRequest((req) => req.method() === 'POST' && req.url().endsWith('/admin/events'));
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  const body = (await sent).postDataJSON();
  expect(body.ticketId).toBeUndefined();
  expect(body.ticketsRemaining).toBe(25);
  expect(body.capacity).toBeUndefined();
  expect(body.price).toBe(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL('/events');
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
});

test('edit without selecting an image preserves the stored picture', async ({ page, request }) => {
  const name = `${prefix} preserve`;
  const created = await request.post(`${API}/admin/events`, { data: {
    heading: name, type: 'general', datetime: '2026-10-24T13:12:34Z', price: 0,
    picture: 'https://cdn.example.test/existing.webp',
  } });
  expect(created.status()).toBe(201);
  const event = (await created.json()).event;
  await page.goto(`/events?eventId=${event.id}`);
  await expect(page.getByAltText('Event preview')).toHaveAttribute('src', event.picture);
  await page.getByLabel('Heading').fill(`${name} edited`);
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('cell', { name: `${name} edited`, exact: true })).toBeVisible();
  const reloaded = await request.get(`${API}/admin/events/${event.id}`);
  const saved = (await reloaded.json()).event;
  expect(saved.picture).toBe(event.picture);
  expect(saved.datetime).toBe(event.datetime);
});

test('invalid or oversized images show errors and block saving', async ({ page }) => {
  await fillNew(page, `${prefix} invalid image`);
  await page.getByLabel('Picture', { exact: true }).setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByText('SVG is not allowed.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Picture', { exact: true }).setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByText('Choose a nonempty image up to 2 MB.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await expect(page.getByText('Choose a nonempty image up to 2 MB.')).toHaveCount(0);
});

test('backend validation issues appear next to the correct form field', async ({ page }) => {
  await fillNew(page, `${prefix} validation`);
  await page.getByLabel('Tickets remaining').fill('-1');
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(page.getByLabel('Tickets remaining')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Please correct the highlighted fields');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('selected File previews, sends a multipart boundary, and real R2 failure prevents false success', async ({ page, request }) => {
  const name = `${prefix} R2 create failure`;
  await fillNew(page, name);
  await page.getByLabel('Picture', { exact: true }).setInputFiles({ name: 'event.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Event preview')).toHaveAttribute('src', /^blob:/);
  const sent = page.waitForRequest((req) => req.method() === 'POST' && req.url().endsWith('/admin/events'));
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  const upload = await sent;
  expect(upload.headers()['content-type']).toMatch(/^multipart\/form-data; boundary=/);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Image storage unavailable');
  await expect(page.getByRole('dialog')).toBeVisible();
  const list = await request.get(`${API}/admin/events?search=${encodeURIComponent(name)}`);
  expect((await list.json()).pagination.total).toBe(0);
});

test('image-only replacement submits; R2 failure keeps original image and modal open', async ({ page, request }) => {
  const created = await request.post(`${API}/admin/events`, { data: {
    heading: `${prefix} replacement`, type: 'general', datetime: '2026-10-24T00:00:00Z', price: 0,
    picture: 'https://cdn.example.test/original.webp',
  } });
  const event = (await created.json()).event;
  await page.goto(`/events?eventId=${event.id}`);
  await page.getByLabel('Picture', { exact: true }).setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Image storage unavailable');
  const reloaded = await request.get(`${API}/admin/events/${event.id}`);
  expect((await reloaded.json()).event.picture).toBe(event.picture);
  await page.reload();
  await expect(page.getByAltText('Event preview')).toHaveAttribute('src', event.picture);
});

test('create and update backend errors remain visible without navigation', async ({ page, request }) => {
  await fillNew(page, `${prefix} server failure`);
  // HTTP failure injection tests presentation only; successful requests use real PostgreSQL.
  await page.route('**/api/admin/events', (route) => route.request().method() === 'POST'
    ? route.fulfill({ status: 500, json: { error: 'Unable to save event. Please try again.' } })
    : route.continue());
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Unable to save event');
  await expect(page.getByRole('dialog')).toBeVisible();
  const created = await request.post(`${API}/admin/events`, { data: {
    heading: `${prefix} update failure`, type: 'general', datetime: '2026-10-24T00:00:00Z', price: 0,
  } });
  const event = (await created.json()).event;
  await page.goto(`/events?eventId=${event.id}`);
  await page.getByLabel('Heading').fill(`${prefix} changed`);
  await page.route(`**/api/admin/events/${event.id}`, (route) => route.request().method() === 'PATCH'
    ? route.fulfill({ status: 500, json: { error: 'Unable to save event. Please try again.' } })
    : route.continue());
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Unable to save event');
  await expect(page.getByRole('dialog')).toBeVisible();
});
