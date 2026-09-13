'use client'

import { useState } from 'react'

import ConfirmDialog from '@/components/common/ConfirmDialog'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import Field from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { useMutation } from '@/hooks/useMutation'
import { apiErrorMessage } from '@/lib/api/errors'
import {
  createEvent,
  deleteEvent,
  getEvent,
  unpublishEvent,
  updateEvent,
} from '@/lib/api/events'
import { listVenues } from '@/lib/api/venues'
import {
  dateTimeInputToIso,
  isoToDateInput,
  isoToTimeInput,
  paiseToRupeeInput,
  rupeeInputToPaise,
} from '@/lib/format'
import {
  EVENT_TYPES,
  type AdminEvent,
  type EventInput,
  type ListResponse,
  type Venue,
} from '@/types'

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  event?: AdminEvent | null
  eventId?: number | null
  onSaved: () => void
}

function blankForm(): EventInput {
  return {
    type: 'general',
    heading: '',
    description: '',
    catchyPara: '',
    picture: '',
    datetime: null,
    startTime: null,
    endTime: null,
    price: 0,
    ticketId: null,
    venueId: null,
    committee: '',
    isTeamEvent: false,
    teamSize: null,
    capacity: null,
    published: false,
  }
}

function eventToForm(event: AdminEvent): EventInput {
  return {
    type: event.type,
    heading: event.heading,
    description: event.description ?? '',
    catchyPara: event.catchyPara ?? '',
    picture: event.picture ?? '',
    datetime: event.datetime,
    startTime: event.startTime,
    endTime: event.endTime,
    price: event.price,
    ticketId: event.ticketId ?? null,
    venueId: event.venue?.id ?? null,
    committee: event.committee ?? '',
    isTeamEvent: event.isTeamEvent,
    teamSize: event.teamSize,
    capacity: event.capacity,
    published: event.published,
  }
}

function EventFormDialog({
  onClose,
  event,
  onSaved,
}: {
  onClose: () => void
  event?: AdminEvent | null
  onSaved: () => void
}) {
  const isEdit = !!event

  const [form, setForm] = useState<EventInput>(() =>
    event ? eventToForm(event) : blankForm(),
  )
  const [priceInput, setPriceInput] = useState(() =>
    event ? paiseToRupeeInput(event.price) : '0.00',
  )

  const [dateInput, setDateInput] = useState(() =>
    isoToDateInput(event?.startTime ?? event?.datetime),
  )
  const [startTimeInput, setStartTimeInput] = useState(() =>
    isoToTimeInput(event?.startTime),
  )
  const [endTimeInput, setEndTimeInput] = useState(() =>
    isoToTimeInput(event?.endTime),
  )

  const [lifecycleOpen, setLifecycleOpen] = useState(false)

  const venues = useApi<ListResponse<Venue>>('venues:all', listVenues)

  const create = useMutation((body: EventInput) => createEvent(body))
  const update = useMutation((id: number, body: Partial<EventInput>) =>
    updateEvent(id, body),
  )
  /*
   * Published events unpublish; drafts delete. Two different endpoints, one
   * button, because only one of them applies to a given event.
   */
  const lifecycle = useMutation(async (id: number): Promise<void> => {
    if (event?.published) await unpublishEvent(id)
    else await deleteEvent(id)
  })

  const mutation = isEdit ? update : create

  // A 409 means the save did not happen, so it is reported in the banner below
  // and nothing else moves.

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function handlePriceChange(value: string) {
    setPriceInput(value)
    const paise = rupeeInputToPaise(value)
    if (paise !== null) set('price', paise)
  }

  function handleDateChange(newDate: string) {
    setDateInput(newDate)
    if (!newDate) {
      set('datetime', null)
      set('startTime', null)
      set('endTime', null)
      return
    }
    const startIso = startTimeInput
      ? dateTimeInputToIso(`${newDate}T${startTimeInput}`)
      : null
    const endIso = endTimeInput
      ? dateTimeInputToIso(`${newDate}T${endTimeInput}`)
      : null
    set('datetime', startIso ?? dateTimeInputToIso(`${newDate}T00:00`))
    set('startTime', startIso)
    set('endTime', endIso)
  }

  function handleStartTimeChange(newTime: string) {
    setStartTimeInput(newTime)
    if (!dateInput || !newTime) {
      set('startTime', null)
      if (dateInput) {
        set('datetime', dateTimeInputToIso(`${dateInput}T00:00`))
      } else {
        set('datetime', null)
      }
      return
    }
    const startIso = dateTimeInputToIso(`${dateInput}T${newTime}`)
    set('startTime', startIso)
    set('datetime', startIso)
  }

  function handleEndTimeChange(newTime: string) {
    setEndTimeInput(newTime)
    if (!dateInput || !newTime) {
      set('endTime', null)
      return
    }
    const endIso = dateTimeInputToIso(`${dateInput}T${newTime}`)
    set('endTime', endIso)
  }

  async function handleSubmit() {
    const paise = rupeeInputToPaise(priceInput)
    if (paise === null) return

    const startIso =
      dateInput && startTimeInput
        ? dateTimeInputToIso(`${dateInput}T${startTimeInput}`)
        : null
    const endIso =
      dateInput && endTimeInput
        ? dateTimeInputToIso(`${dateInput}T${endTimeInput}`)
        : null
    const datetimeIso =
      startIso ?? (dateInput ? dateTimeInputToIso(`${dateInput}T00:00`) : null)

    const body: EventInput = {
      ...form,
      price: paise,
      datetime: datetimeIso,
      startTime: startIso,
      endTime: endIso,
    }

    if (!body.isTeamEvent) {
      body.teamSize = null
    }

    if (isEdit && event) {
      const original = eventToForm(event)
      const changed: Partial<EventInput> = {}
      ;(Object.keys(body) as (keyof EventInput)[]).forEach((key) => {
        if (body[key] !== original[key]) {
          ;(changed as Record<string, unknown>)[key] = body[key]
        }
      })

      if (Object.keys(changed).length === 0) {
        onClose()
        return
      }

      const result = await update.run(event.id, changed)
      if (result) {
        onSaved()
        onClose()
      }
    } else {
      const result = await create.run(body)
      if (result) {
        onSaved()
        onClose()
      }
    }
  }

  const fields = mutation.fields
  const venueList = venues.data?.items ?? []

  return (
    <>
      <Modal
        open={true}
        onClose={mutation.loading || lifecycle.loading ? () => {} : onClose}
        title={isEdit ? 'Edit Event' : 'Create Event'}
        description={
          isEdit
            ? 'Modify the event details and save.'
            : 'Fill in the details to create a new event. Save as draft first.'
        }
        footer={
          <div className='flex w-full items-center justify-between'>
            <div>
              {isEdit && event ? (
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                  disabled={mutation.loading || lifecycle.loading}
                  onClick={() => {
                    lifecycle.reset()
                    setLifecycleOpen(true)
                  }}
                >
                  {event.published ? 'Unpublish' : 'Delete'}
                </Button>
              ) : null}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                onClick={onClose}
                disabled={mutation.loading || lifecycle.loading}
              >
                Cancel
              </Button>
              <Button
                size='sm'
                variant='primary'
                loading={mutation.loading}
                disabled={lifecycle.loading}
                onClick={handleSubmit}
              >
                {isEdit ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </div>
        }
      >
        {mutation.error && mutation.error.issues.length === 0 ? (
          <div className='mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
            <p>{apiErrorMessage(mutation.error)}</p>

            {/*
             * The backend's 409 is a bare Prisma P2002 handler that drops
             * err.meta.target, so the message never names a field — and on
             * create it is not a duplicate at all. The Event id sequence is
             * behind the rows already in the table, so the insert collides with
             * an existing primary key. Nothing about the form causes it and
             * nothing in the form can avoid it.
             */}
            {!isEdit && mutation.error.status === 409 ? (
              <p className='mt-1 text-xs'>
                Despite the wording, this is almost certainly not a duplicate —
                no field on an event has to be unique. The event ID counter on
                the server has fallen behind the existing rows, so new events
                collide with IDs that are already taken. It needs a backend fix;
                retrying will keep failing until the counter passes the highest
                existing ID.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <Field label='Heading' error={fields.heading} required>
              {(props) => (
                <Input
                  {...props}
                  value={form.heading}
                  onChange={(e) => set('heading', e.target.value)}
                  placeholder='Robotics Workshop'
                />
              )}
            </Field>

            <Field label='Type' error={fields.type} required>
              {(props) => (
                <Select
                  {...props}
                  value={form.type}
                  onChange={(e) =>
                    set('type', e.target.value as EventInput['type'])
                  }
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t} className='capitalize'>
                      {t}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label='Description' error={fields.description}>
            {(props) => (
              <Textarea
                {...props}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder='Describe the event…'
                rows={3}
              />
            )}
          </Field>

          <Field label='Catchy Paragraph' error={fields.catchyPara}>
            {(props) => (
              <Input
                {...props}
                value={form.catchyPara ?? ''}
                onChange={(e) => set('catchyPara', e.target.value)}
                placeholder='Build something useful'
              />
            )}
          </Field>

          {/*
            This was a drag-and-drop uploader posting to a relative /api/upload.
            The panel has no app/api directory, so every drop hit Next's HTML
            404, res.ok was false, and the handler returned without a word —
            the field could never be set and never said why. There is no object
            storage configured to upload to, so the honest control is the URL
            the backend actually stores: `picture` is just a string column.
          */}
          <Field label='Picture URL' error={fields.picture}>
            {(props) => (
              <Input
                {...props}
                type='url'
                inputMode='url'
                value={form.picture ?? ''}
                onChange={(e) => set('picture', e.target.value)}
                placeholder='https://images.tiqr.events/…'
              />
            )}
          </Field>

          {form.picture ? (
            <div className='flex items-center gap-3'>
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
                  external host; next/image would need it in remotePatterns. */}
              <img
                src={form.picture}
                alt=''
                className='h-20 w-20 rounded-lg border border-border object-cover'
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <p className='text-xs text-muted-foreground'>
                Preview. If nothing appears, the URL is not reachable.
              </p>
            </div>
          ) : null}

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <Field label='Date' error={fields.datetime}>
              {(props) => (
                <Input
                  {...props}
                  type='date'
                  value={dateInput}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              )}
            </Field>

            <Field label='Start Time' error={fields.startTime}>
              {(props) => (
                <Input
                  {...props}
                  type='time'
                  value={startTimeInput}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              )}
            </Field>

            <Field label='End Time' error={fields.endTime}>
              {(props) => (
                <Input
                  {...props}
                  type='time'
                  value={endTimeInput}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                />
              )}
            </Field>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <Field
              label='Price (₹)'
              error={fields.price}
              hint='Enter in Rupees; stored as paise.'
            >
              {(props) => (
                <Input
                  {...props}
                  type='text'
                  inputMode='decimal'
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder='499.00'
                />
              )}
            </Field>

            <Field label='Capacity' error={fields.capacity}>
              {(props) => (
                <Input
                  {...props}
                  type='number'
                  min={0}
                  value={form.capacity ?? ''}
                  onChange={(e) =>
                    set(
                      'capacity',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  placeholder='100'
                />
              )}
            </Field>

            <Field label='Venue' error={fields.venueId}>
              {(props) => (
                <Select
                  {...props}
                  value={form.venueId ?? ''}
                  onChange={(e) =>
                    set(
                      'venueId',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value=''>No venue</option>
                  {venueList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <Field label='Committee' error={fields.committee}>
            {(props) => (
              <Input
                {...props}
                value={form.committee ?? ''}
                onChange={(e) => set('committee', e.target.value)}
                placeholder='Robotics Committee'
              />
            )}
          </Field>

          {/* Parity with the announcement form, which has had this all along.
              Creating still defaults to draft — blankForm() sets published:false. */}
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='event-published'
              checked={form.published ?? false}
              onChange={(e) => set('published', e.target.checked)}
              className='h-4 w-4 rounded border-input accent-primary'
            />
            <label
              htmlFor='event-published'
              className='text-sm font-medium text-foreground'
            >
              {isEdit ? 'Published' : 'Publish immediately'}
            </label>
          </div>
        </div>
      </Modal>

      {isEdit && event ? (
        <ConfirmDialog
          open={lifecycleOpen}
          title={event.published ? 'Unpublish event' : 'Delete event'}
          description={
            event.published
              ? `Unpublish "${event.heading}"? It stays in the admin list as a draft and comes off the public site.`
              : `Delete "${event.heading}"? This cannot be undone.`
          }
          confirmLabel={event.published ? 'Unpublish' : 'Delete'}
          destructive
          loading={lifecycle.loading}
          error={lifecycle.error}
          onConfirm={async () => {
            const result = await lifecycle.run(event.id)
            if (result !== null) {
              setLifecycleOpen(false)
              onSaved()
              onClose()
            }
          }}
          onCancel={() => {
            lifecycle.reset()
            setLifecycleOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

function EventFormLoader({
  eventId,
  onClose,
  onSaved,
}: {
  eventId: number
  onClose: () => void
  onSaved: () => void
}) {
  const eventApi = useApi<AdminEvent>(`event:${eventId}`, () =>
    getEvent(eventId),
  )

  if (eventApi.loading) {
    return (
      <Modal open={true} onClose={onClose} title='Loading Event'>
        <div className='flex justify-center py-12'>
          <Spinner className='h-8 w-8 text-foreground' />
        </div>
      </Modal>
    )
  }

  if (eventApi.error) {
    return (
      <Modal open={true} onClose={onClose} title='Error Loading Event'>
        <div className='py-4'>
          <ErrorState error={eventApi.error} onRetry={eventApi.refetch} />
        </div>
      </Modal>
    )
  }

  if (!eventApi.data) {
    return null
  }

  return (
    <EventFormDialog
      key={`edit-${eventApi.data.id}`}
      event={eventApi.data}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

export default function EventFormModal({
  open,
  onClose,
  event,
  eventId,
  onSaved,
}: EventFormModalProps) {
  if (!open) return null

  if (event) {
    return (
      <EventFormDialog
        key={`edit-${event.id}`}
        onClose={onClose}
        event={event}
        onSaved={onSaved}
      />
    )
  }

  if (eventId) {
    return (
      <EventFormLoader
        key={`load-${eventId}`}
        eventId={eventId}
        onClose={onClose}
        onSaved={onSaved}
      />
    )
  }

  return (
    <EventFormDialog
      key='create'
      onClose={onClose}
      event={null}
      onSaved={onSaved}
    />
  )
}
