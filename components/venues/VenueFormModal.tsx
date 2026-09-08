"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useMutation } from "@/hooks/useMutation";
import { createVenue, updateVenue } from "@/lib/api/venues";
import type { LatLng } from "@/lib/geo";
import type { Venue, VenueInput } from "@/types";

import MapPositionField from "./MapPositionField";

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

/**
 * A venue either has both coordinates or neither. One without the other is not
 * a position, so the pair is held together rather than as two loose fields.
 */
function toPosition(venue?: Venue | null): LatLng | null {
  if (!venue || venue.latitude == null || venue.longitude == null) return null;
  return { latitude: venue.latitude, longitude: venue.longitude };
}

export default function VenueFormModal({
  venue,
  onClose,
  onSaved,
}: VenueFormModalProps) {
  const [name, setName] = useState(venue?.name ?? "");
  const [location, setLocation] = useState(venue?.address ?? "");
  const [position, setPosition] = useState<LatLng | null>(() =>
    toPosition(venue),
  );
  const [nameError, setNameError] = useState<string | null>(null);

  const save = useMutation(async (body: VenueInput) =>
    venue ? updateVenue(venue.id, body) : createVenue(body),
  );

  async function submit() {
    if (!name.trim()) {
      setNameError("Required");
      return;
    }
    setNameError(null);

    const saved = await save.run({
      name: name.trim(),
      // The API field is `address`; "Location" is just what it is called on
      // screen, because that is what an admin would call it.
      address: location.trim() || null,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
    });

    if (saved) onSaved();
  }

  // Backend validation wins over the local guess for the same field.
  const errorFor = (key: string) =>
    save.fields[key] ?? (key === "name" ? (nameError ?? undefined) : undefined);

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
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {save.error.message}
          </p>
        ) : null}

        <Field label="Name" required error={errorFor("name")}>
          {(props) => (
            <Input
              {...props}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Hall"
            />
          )}
        </Field>

        <Field label="Location" error={errorFor("address")}>
          {(props) => (
            <Input
              {...props}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Academic Block, NIT Calicut"
            />
          )}
        </Field>

        <MapPositionField
          value={position}
          onChange={setPosition}
          error={errorFor("latitude") ?? errorFor("longitude")}
        />
      </div>
    </Modal>
  );
}
