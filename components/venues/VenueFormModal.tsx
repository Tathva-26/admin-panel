"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useMutation } from "@/hooks/useMutation";
import { createVenue, updateVenue } from "@/lib/api/venues";
import type { Venue, VenueInput } from "@/types";

/**
 * Mounted only while open, and keyed by venue in the parent — so the draft
 * resets by remounting rather than by syncing state in an effect.
 */
interface VenueFormModalProps {
  /** Absent when creating. */
  venue?: Venue | null;
  onClose: () => void;
  onSaved: () => void;
}

/*
 * The backend declares latitude/longitude as z.number(), not z.coerce.number() —
 * a string is rejected outright. Blank means "not set", so it has to become null
 * rather than NaN.
 */
function parseCoord(
  raw: string,
  min: number,
  max: number,
): { value?: number | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { error: "Must be a number" };
  if (parsed < min || parsed > max)
    return { error: `Must be between ${min} and ${max}` };

  return { value: parsed };
}

export default function VenueFormModal({
  venue,
  onClose,
  onSaved,
}: VenueFormModalProps) {
  const [name, setName] = useState(venue?.name ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [latitude, setLatitude] = useState(venue?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(venue?.longitude?.toString() ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [coordError, setCoordError] = useState<Record<string, string>>({});

  const save = useMutation(async (body: VenueInput) =>
    venue ? updateVenue(venue.id, body) : createVenue(body),
  );

  async function submit() {
    const nextCoordError: Record<string, string> = {};

    if (!name.trim()) {
      setNameError("Required");
      return;
    }
    setNameError(null);

    const lat = parseCoord(latitude, -90, 90);
    const lng = parseCoord(longitude, -180, 180);
    if (lat.error) nextCoordError.latitude = lat.error;
    if (lng.error) nextCoordError.longitude = lng.error;

    setCoordError(nextCoordError);
    if (Object.keys(nextCoordError).length > 0) return;

    const saved = await save.run({
      name: name.trim(),
      address: address.trim() || null,
      latitude: lat.value ?? null,
      longitude: lng.value ?? null,
    });

    if (saved) onSaved();
  }

  // Backend validation wins over the local guess for the same field.
  const errorFor = (key: string) =>
    save.fields[key] ??
    (key === "name" ? (nameError ?? undefined) : undefined) ??
    coordError[key];

  return (
    <Modal
      open
      onClose={save.loading ? () => {} : onClose}
      title={venue ? `Edit ${venue.name}` : "New venue"}
      description="Venues are selectable when scheduling an event."
      footer={
        <>
          <Button size="sm" onClick={onClose} disabled={save.loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={save.loading}
            onClick={submit}
          >
            {venue ? "Save changes" : "Create venue"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* A non-field error (409, 500, network) still has to be visible. */}
        {save.error && Object.keys(save.fields).length === 0 ? (
          <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{save.error.message}</p>

            {/*
             * Creating a venue currently always 500s: Venue.id has no
             * @default(autoincrement()) in the Prisma schema, so the insert has
             * no id to use. Nothing the panel sends can work around it — the
             * validator strips an explicit `id`. Say so, rather than leaving a
             * bare "Internal server error" on screen.
             */}
            {!venue && save.error.status === 500 ? (
              <p className="mt-1 text-xs">
                This is a known server-side problem, not something wrong with
                what you entered: the venue table has no auto-generated ID.
                It needs a backend fix before new venues can be created.
              </p>
            ) : null}
          </div>
        ) : null}

        <Field label="Name" required error={errorFor("name")}>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Otherwise "Required" sits there accusingly while they type.
                if (nameError) setNameError(null);
              }}
              maxLength={255}
              placeholder="Main Hall"
            />
          )}
        </Field>

        <Field label="Address" error={errorFor("address")}>
          {(props) => (
            <Input
              {...props}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              placeholder="Academic Block, NIT Calicut"
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Latitude" error={errorFor("latitude")}>
            {(props) => (
              <Input
                {...props}
                inputMode="decimal"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="11.3210"
              />
            )}
          </Field>

          <Field label="Longitude" error={errorFor("longitude")}>
            {(props) => (
              <Input
                {...props}
                inputMode="decimal"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="75.9337"
              />
            )}
          </Field>
        </div>
      </div>
    </Modal>
  );
}
