## Admin Features

This frontend currently includes three admin features:

* **Events**
* **Needs Attention**
* **Announcements**

These features are implemented on the frontend and communicate with the real backend through the API client and resource modules under `lib/api/`.

---

## Events

The Events page provides the main event-management workflow for administrators.

### Implemented

* Paginated event list
* Search by heading, description, or committee
* Filter by event type
* Filter by published/draft state
* Create events
* Edit events
* Publish events
* Unpublish events
* Archive events
* Row-level actions
* Bulk publish/unpublish
* CSV export
* Venue selection
* Team-event configuration
* Capacity
* Price
* Ticket ID
* Committee
* Event description and catchy paragraph
* Picture URL
* Date, start time, and end time
* Publish-immediately option
* Loading, empty, retry, and error states
* Field-level API validation errors

### Event data

Prices are handled as integer **paise** at the API boundary.

Dates entered through the event form are interpreted as **IST** and sent to the API as ISO timestamps. Event dates are displayed in IST.

When editing an event, the frontend sends only the fields that have changed.

### Event actions

The available row actions are:

* Edit
* Publish / Unpublish
* Archive

Archiving uses the event `DELETE` endpoint. The frontend treats this operation as an archive rather than assuming that the backend permanently deletes the event.

### Backend endpoints

The real backend is expected to provide:

```text
GET    /api/admin/events
GET    /api/admin/events/:id
POST   /api/admin/events
PATCH  /api/admin/events/:id
POST   /api/admin/events/:id/publish
POST   /api/admin/events/:id/unpublish
DELETE /api/admin/events/:id

GET    /api/admin/venues
```

The backend remains responsible for authoritative validation and business rules, including:

* Team-event requirements
* Date consistency
* Capacity
* Price
* Publishability
* Registration behavior
* Ticket behavior
* Venue rules

### Current limitations

The current frontend does not provide an Events sorting control.

The frontend also does not currently validate that the end time occurs after the start time. Some event validation is intentionally left to the backend.

---

## Needs Attention

Needs Attention is a dashboard feature that identifies events that may require administrator review.

It is **frontend-computed**. There is currently no separate backend Needs Attention endpoint.

### Current checks

The dashboard currently checks for:

1. **Published event without a venue**
2. **Published event without a start time**
3. **Team event with a team size below 2**
4. **Draft event whose start time has already passed**
5. **Published event that is full**

Warnings are shown before informational items.

### Check action

Each item has a single:

**Check**

action.

Check opens the specific event in the Events editor so the administrator can inspect and decide what to do.

Check does **not** automatically:

* Fix the event
* Publish the event
* Unpublish the event
* Archive the event
* Change any event data
* Mark the issue as resolved

The administrator remains responsible for making any required correction through the normal Events workflow.

### Current limitation

Needs Attention currently examines the first **100 events** returned by the Events API.

There is no pagination loop, backend issue tracking, or resolution state.

The rules are defined in the frontend and can be found in:

```text
lib/attention.ts
```

If new attention rules are added or existing rules are changed, update this file and update the documentation accordingly.

---

## Announcements

The Announcements page provides administrators with announcement management.

### Implemented

* Paginated announcement list
* Published/draft filtering
* Create announcement
* Edit announcement
* Publish announcement
* Unpublish announcement
* Delete announcement
* Row-level actions
* Bulk publish/unpublish
* Title and content fields
* Publish-immediately option
* Field-level API validation errors
* Loading states
* Empty states
* Retryable error states
* Mutation feedback

When editing an announcement, the frontend sends only the fields that have changed.

### Backend endpoints

The real backend is expected to provide:

```text
GET    /api/admin/announcements
GET    /api/admin/announcements/:id
POST   /api/admin/announcements
PATCH  /api/admin/announcements/:id
POST   /api/admin/announcements/:id/publish
POST   /api/admin/announcements/:id/unpublish
DELETE /api/admin/announcements/:id
```

### Current limitations

The current Announcements UI does not expose a search control.

The current Announcements UI also does not expose sorting controls.

The frontend treats announcement deletion as a permanent delete operation. The backend implementation should therefore match the expected API semantics.

---

## Frontend ↔ Backend Integration

The feature code is separated from the API layer.

Resource-specific API requests should remain in:

```text
lib/api/
```

The main feature areas currently use:

```text
lib/api/events.ts
lib/api/venues.ts
lib/api/announcements.ts
```

The shared API client is responsible for communicating with the backend.

The real backend must provide the endpoints expected by these modules and return the response structures defined by the project's API contract.

For list responses, the frontend expects the standard pagination structure:

```text
{
  items,
  page,
  pageSize,
  total
}
```

Resource responses should follow the documented response wrappers, such as:

```text
{
  event: ...
}
```

and

```text
{
  announcement: ...
}
```

Backend validation errors should provide enough information for the frontend to associate field errors with the appropriate form fields.

---

## Authentication

Events and Announcements are admin features and must ultimately be protected by the real backend.

The backend must determine whether the authenticated user has the required admin role.

The frontend should handle authentication/authorization responses according to the API contract, including:

* `401` — invalid or expired authentication
* `403` — authenticated but not authorized as an admin
* `404` — requested resource does not exist
* `409` — resource conflict
* `422` — validation/business-rule error
* `429` — rate limited
* `500` — server error

---

The intended production architecture is:

```text
Admin UI
   ↓
lib/api/*
   ↓
Shared API client
   ↓
Real Backend API
   ↓
Database
```

---

## Important Maintenance Notes

When extending these features:

* Keep API requests inside the appropriate `lib/api/` resource module.
* Follow the existing shared API client and error-handling patterns.
* Keep money values in integer paise at the API boundary.
* Keep API dates in the format expected by the backend contract.
* Preserve the standard pagination response shape.
* Preserve partial-update behavior for `PATCH` requests.
* Keep publish/unpublish as explicit backend actions.
* Do not make Needs Attention automatically modify event data.
* Update `lib/attention.ts` when adding or changing attention rules.
* Update this README when the actual UI behavior changes.

The API contract remains the source of truth for the frontend/backend boundary.
