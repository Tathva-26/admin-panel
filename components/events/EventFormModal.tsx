"use client";

import { useEffect, useState } from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Field from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiErrorMessage } from "@/lib/api/errors";
import {
  archiveEvent,
  createEvent,
  getEvent,
  updateEvent,
} from "@/lib/api/events";
import { listVenues } from "@/lib/api/venues";
import { eventTypeLabel } from "@/lib/labels";
import {
  dateTimeInputToIso,
  isoToDateInput,
  isoToTimeInput,
  paiseToRupeeInput,
  rupeeInputToPaise,
} from "@/lib/format";
import {
  EVENT_TYPES,
  type AdminEvent,
  type EventInput,
  type ListResponse,
  type Venue,
} from "@/types";

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: AdminEvent | null;
  eventId?: number | null;
  onSaved: () => void;
}

function blankForm(): EventInput {
  return {
    type: "general",
    heading: "",
    description: "",
    catchyPara: "",
    picture: "",
    datetime: null,
    startTime: null,
    endTime: null,
    price: 0,
    ticketId: null,
    venueId: null,
    committee: "",
    isTeamEvent: false,
    teamSize: null,
    capacity: null,
    published: false,
  };
}

function eventToForm(event: AdminEvent): EventInput {
  return {
    type: event.type,
    heading: event.heading,
    description: event.description ?? "",
    catchyPara: event.catchyPara ?? "",
    picture: event.picture ?? "",
    datetime: event.datetime,
    startTime: event.startTime,
    endTime: event.endTime,
    price: event.price,
    ticketId: event.ticketId ?? null,
    venueId: event.venue?.id ?? null,
    committee: event.committee ?? "",
    isTeamEvent: event.isTeamEvent,
    teamSize: event.teamSize,
    capacity: event.capacity,
    published: event.published,
  };
}

function EventFormDialog({
  onClose,
  event,
  onSaved,
}: {
  onClose: () => void;
  event?: AdminEvent | null;
  onSaved: () => void;
}) {
  const isEdit = !!event;

  const [form, setForm] = useState<EventInput>(() =>
    event ? eventToForm(event) : blankForm(),
  );
  const [priceInput, setPriceInput] = useState(() =>
    event ? paiseToRupeeInput(event.price) : "0.00",
  );

  const [dateInput, setDateInput] = useState(() =>
    isoToDateInput(event?.startTime ?? event?.datetime),
  );
  const [startTimeInput, setStartTimeInput] = useState(() =>
    isoToTimeInput(event?.startTime),
  );
  const [endTimeInput, setEndTimeInput] = useState(() =>
    isoToTimeInput(event?.endTime),
  );

  const [archiveOpen, setArchiveOpen] = useState(false);

  const venues = useApi<ListResponse<Venue>>("venues:all", listVenues);

  const create = useMutation((body: EventInput) => createEvent(body));
  const update = useMutation((id: number, body: Partial<EventInput>) =>
    updateEvent(id, body),
  );
  const archive = useMutation((id: number) => archiveEvent(id));

  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (mutation.error?.status === 409) {
      onSaved();
    }
  }, [mutation.error, onSaved]);

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handlePriceChange(value: string) {
    setPriceInput(value);
    const paise = rupeeInputToPaise(value);
    if (paise !== null) set("price", paise);
  }

  function handleDateChange(newDate: string) {
    setDateInput(newDate);
    if (!newDate) {
      set("datetime", null);
      set("startTime", null);
      set("endTime", null);
      return;
    }
    const startIso = startTimeInput
      ? dateTimeInputToIso(`${newDate}T${startTimeInput}`)
      : null;
    const endIso = endTimeInput
      ? dateTimeInputToIso(`${newDate}T${endTimeInput}`)
      : null;
    set("datetime", startIso ?? dateTimeInputToIso(`${newDate}T00:00`));
    set("startTime", startIso);
    set("endTime", endIso);
  }

  function handleStartTimeChange(newTime: string) {
    setStartTimeInput(newTime);
    if (!dateInput || !newTime) {
      set("startTime", null);
      if (dateInput) {
        set("datetime", dateTimeInputToIso(`${dateInput}T00:00`));
      } else {
        set("datetime", null);
      }
      return;
    }
    const startIso = dateTimeInputToIso(`${dateInput}T${newTime}`);
    set("startTime", startIso);
    set("datetime", startIso);
  }

  function handleEndTimeChange(newTime: string) {
    setEndTimeInput(newTime);
    if (!dateInput || !newTime) {
      set("endTime", null);
      return;
    }
    const endIso = dateTimeInputToIso(`${dateInput}T${newTime}`);
    set("endTime", endIso);
  }

  async function handleSubmit() {
    const paise = rupeeInputToPaise(priceInput);
    if (paise === null) return;

    const startIso =
      dateInput && startTimeInput
        ? dateTimeInputToIso(`${dateInput}T${startTimeInput}`)
        : null;
    const endIso =
      dateInput && endTimeInput
        ? dateTimeInputToIso(`${dateInput}T${endTimeInput}`)
        : null;
    const datetimeIso =
      startIso ??
      (dateInput ? dateTimeInputToIso(`${dateInput}T00:00`) : null);

    const body: EventInput = {
      ...form,
      price: paise,
      datetime: datetimeIso,
      startTime: startIso,
      endTime: endIso,
    };

    if (!body.isTeamEvent) {
      body.teamSize = null;
    }

    if (isEdit && event) {
      const original = eventToForm(event);
      const changed: Partial<EventInput> = {};
      (Object.keys(body) as (keyof EventInput)[]).forEach((key) => {
        if (body[key] !== original[key]) {
          (changed as Record<string, unknown>)[key] = body[key];
        }
      });

      if (Object.keys(changed).length === 0) {
        onClose();
        return;
      }

      const result = await update.run(event.id, changed);
      if (result) {
        onSaved();
        onClose();
      }
    } else {
      const result = await create.run(body);
      if (result) {
        onSaved();
        onClose();
      }
    }
  }

  const fields = mutation.fields;
  const venueList = venues.data?.items ?? [];

  return (
    <>
      <Modal
        open={true}
        onClose={mutation.loading || archive.loading ? () => {} : onClose}
        title={isEdit ? "Edit Event" : "Create Event"}
        description={
          isEdit
            ? "Modify the event details and save."
            : "Fill in the details to create a new event. Save as draft first."
        }
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              {isEdit && event ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={mutation.loading || archive.loading}
                  onClick={() => {
                    archive.reset();
                    setArchiveOpen(true);
                  }}
                >
                  Archive
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onClose}
                disabled={mutation.loading || archive.loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={mutation.loading}
                disabled={archive.loading}
                onClick={handleSubmit}
              >
                {isEdit ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </div>
        }
      >
        {mutation.error && mutation.error.issues.length === 0 ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiErrorMessage(mutation.error)}
          </p>
        ) : null}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Heading" error={fields.heading} required>
              {(props) => (
                <Input
                  {...props}
                  value={form.heading}
                  onChange={(e) => set("heading", e.target.value)}
                  placeholder="Robotics Workshop"
                />
              )}
            </Field>

            <Field label="Type" error={fields.type} required>
              {(props) => (
                <Select
                  {...props}
                  value={form.type}
                  onChange={(e) =>
                    set("type", e.target.value as EventInput["type"])
                  }
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {eventTypeLabel(t)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label="Description" error={fields.description}>
            {(props) => (
              <Textarea
                {...props}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the event…"
                rows={3}
              />
            )}
          </Field>

          <Field label="Catchy Paragraph" error={fields.catchyPara}>
            {(props) => (
              <Input
                {...props}
                value={form.catchyPara ?? ""}
                onChange={(e) => set("catchyPara", e.target.value)}
                placeholder="Build something useful"
              />
            )}
          </Field>

          <Field label="Picture URL" error={fields.picture}>
            {(props) => (
              <Input
                {...props}
                type="url"
                value={form.picture ?? ""}
                onChange={(e) => set("picture", e.target.value || null)}
                placeholder="https://example.com/image.jpg"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Date" error={fields.datetime}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={dateInput}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              )}
            </Field>

            <Field label="Start Time" error={fields.startTime}>
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={startTimeInput}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              )}
            </Field>

            <Field label="End Time" error={fields.endTime}>
              {(props) => (
                <Input
                  {...props}
                  type="time"
                  value={endTimeInput}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Price (₹)"
              error={fields.price}
              hint="Enter in Rupees; stored as paise."
            >
              {(props) => (
                <Input
                  {...props}
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="499.00"
                />
              )}
            </Field>

            <Field label="Capacity" error={fields.capacity}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  value={form.capacity ?? ""}
                  onChange={(e) =>
                    set(
                      "capacity",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  placeholder="100"
                />
              )}
            </Field>

            <Field label="Venue" error={fields.venueId}>
              {(props) => (
                <Select
                  {...props}
                  value={form.venueId ?? ""}
                  onChange={(e) =>
                    set(
                      "venueId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">No venue</option>
                  {venueList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label="Committee" error={fields.committee}>
            {(props) => (
              <Input
                {...props}
                value={form.committee ?? ""}
                onChange={(e) => set("committee", e.target.value)}
                placeholder="Robotics Committee"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="isTeamEvent"
                checked={form.isTeamEvent ?? false}
                onChange={(e) => {
                  set("isTeamEvent", e.target.checked);
                  if (!e.target.checked) set("teamSize", null);
                }}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <label
                htmlFor="isTeamEvent"
                className="text-sm font-medium text-zinc-700"
              >
                Team Event
              </label>
            </div>

            {form.isTeamEvent ? (
              <Field label="Team Size" error={fields.teamSize} required>
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={2}
                    value={form.teamSize ?? ""}
                    onChange={(e) =>
                      set(
                        "teamSize",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="4"
                  />
                )}
              </Field>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ticket ID" error={fields.ticketId}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  value={form.ticketId ?? ""}
                  onChange={(e) =>
                    set(
                      "ticketId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  placeholder="Optional"
                />
              )}
            </Field>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="published"
                checked={form.published ?? false}
                onChange={(e) => set("published", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <label
                htmlFor="published"
                className="text-sm font-medium text-zinc-700"
              >
                Publish immediately
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {isEdit && event ? (
        <ConfirmDialog
          open={archiveOpen}
          title="Archive Event"
          description={`Archive "${event.heading}"? This will remove the event from listings.`}
          confirmLabel="Archive"
          destructive
          loading={archive.loading}
          error={archive.error}
          onConfirm={async () => {
            const result = await archive.run(event.id);
            if (result !== null) {
              setArchiveOpen(false);
              onSaved();
              onClose();
            }
          }}
          onCancel={() => {
            archive.reset();
            setArchiveOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function EventFormLoader({
  eventId,
  onClose,
  onSaved,
}: {
  eventId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const eventApi = useApi<AdminEvent>(`event:${eventId}`, () =>
    getEvent(eventId),
  );

  if (eventApi.loading) {
    return (
      <Modal open={true} onClose={onClose} title="Loading Event">
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8 text-zinc-900" />
        </div>
      </Modal>
    );
  }

  if (eventApi.error) {
    return (
      <Modal open={true} onClose={onClose} title="Error Loading Event">
        <div className="py-4">
          <ErrorState error={eventApi.error} onRetry={eventApi.refetch} />
        </div>
      </Modal>
    );
  }

  if (!eventApi.data) {
    return null;
  }

  return (
    <EventFormDialog
      key={`edit-${eventApi.data.id}`}
      event={eventApi.data}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

export default function EventFormModal({
  open,
  onClose,
  event,
  eventId,
  onSaved,
}: EventFormModalProps) {
  if (!open) return null;

  if (event) {
    return (
      <EventFormDialog
        key={`edit-${event.id}`}
        onClose={onClose}
        event={event}
        onSaved={onSaved}
      />
    );
  }

  if (eventId) {
    return (
      <EventFormLoader
        key={`load-${eventId}`}
        eventId={eventId}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <EventFormDialog
      key="create"
      onClose={onClose}
      event={null}
      onSaved={onSaved}
    />
  );
}
