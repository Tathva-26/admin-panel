'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorState from '@/components/ui/ErrorState'
import Field from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { useMutation } from '@/hooks/useMutation'
import { apiErrorMessage } from '@/lib/api/errors'
import { createEvent, getEvent, updateEvent } from '@/lib/api/events'
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

const MAX_IMAGE_BYTES = 1024 * 1024

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
    ticketsRemaining: null,
    published: false,
    passcode: '',
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
    ticketsRemaining: event.ticketsRemaining,
    published: event.published,
    passcode: event.passcode ?? '',
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

  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const imagePreview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  )

  useEffect(() => {
    if (!imagePreview) return
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const venues = useApi<ListResponse<Venue>>('venues:all', listVenues)

  const create = useMutation((body: EventInput, image: File | null) =>
    createEvent(body, image),
  )
  const update = useMutation(
    (id: number, body: Partial<EventInput>, image: File | null) =>
      updateEvent(id, body, image),
  )

  const mutation = isEdit ? update : create

  useEffect(() => {
    if (mutation.error?.status === 409) {
      onSaved()
    }
  }, [mutation.error, onSaved])

  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  function selectImage(file: File | undefined | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG, JPG, WEBP).')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 1 MB.')
      return
    }
    setImageError(null)
    setImage(file)
  }

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

      if (Object.keys(changed).length === 0 && !image) {
        onClose()
        return
      }

      const result = await update.run(event.id, changed, image)
      if (result) {
        onSaved()
        onClose()
      }
    } else {
      const result = await create.run(body, image)
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
        onClose={mutation.loading ? () => {} : onClose}
        title={isEdit ? 'Edit Event' : 'Create Event'}
        description={
          isEdit
            ? 'Modify the event details and save.'
            : 'Fill in the details to create a new event. Save as draft first.'
        }
        footer={
          <div className='flex w-full items-center justify-end gap-2'>
            <Button
              size='sm'
              onClick={onClose}
              disabled={mutation.loading}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              variant='primary'
              loading={mutation.loading}
              onClick={handleSubmit}
            >
              {isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        }
      >
        {mutation.error && mutation.error.issues.length === 0 ? (
          <p className='mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
            {apiErrorMessage(mutation.error)}
          </p>
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

          <Field label='Picture' error={fields.picture}>
            {(props) => (
              <>
                <div
                  {...props}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add(
                      'border-blue-500',
                      'bg-blue-50',
                    )
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove(
                      'border-blue-500',
                      'bg-blue-50',
                    )
                  }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove(
                      'border-blue-500',
                      'bg-blue-50',
                    )

                    selectImage(e.dataTransfer.files?.[0])
                  }}
                  className='flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center transition hover:border-zinc-400'
                  onClick={() =>
                    document.getElementById('picture-upload')?.click()
                  }
                >
                  <input
                    id='picture-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => {
                      selectImage(e.target.files?.[0])
                      // Reset so the same file can be picked again.
                      e.target.value = ''
                    }}
                  />

                  {imagePreview || form.picture ? (
                    <div className='space-y-3'>
                      <img
                        src={imagePreview || form.picture || ''}
                        alt='Preview'
                        className='mx-auto h-32 w-32 rounded-lg object-cover'
                      />
                      <p className='text-xs text-zinc-500'>
                        Click or drop another image to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className='text-sm font-medium text-zinc-700'>
                        Drag & drop an image here
                      </p>
                      <p className='mt-1 text-xs text-zinc-500'>
                        or click to browse
                      </p>
                      <p className='mt-2 text-xs text-zinc-400'>
                        PNG, JPG, WEBP
                      </p>
                    </>
                  )}
                </div>
                {imageError ? (
                  <p className='mt-2 text-sm text-red-600'>{imageError}</p>
                ) : null}
              </>
            )}
          </Field>

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

            <Field
              label='Capacity'
              error={fields.ticketsRemaining}
              hint='Max bookings TIQR will accept. Leave blank to keep the default of 999.'
            >
              {(props) => (
                <Input
                  {...props}
                  type='number'
                  min={0}
                  value={form.ticketsRemaining ?? ''}
                  onChange={(e) =>
                    set(
                      'ticketsRemaining',
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

          <Field
            label='Payment Passcode'
            error={fields.passcode}
            hint='Optional. If set, users must enter this code before they can pay. Leave blank for open registration.'
          >
            {(props) => (
              <Input
                {...props}
                value={form.passcode ?? ''}
                onChange={(e) => set('passcode', e.target.value)}
                placeholder='Leave blank for none'
                autoComplete='off'
              />
            )}
          </Field>
        </div>
      </Modal>
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
          <Spinner className='h-8 w-8 text-zinc-900' />
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
