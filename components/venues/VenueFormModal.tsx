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
      address: address.trim() || null,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
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
          <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {save.error.message}
          </p>
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
              placeholder="Academic Block, NIT Calicut"
            />
          )}
        </Field>

        <div className="flex gap-3">
          <Field label="Latitude" error={errorFor("latitude")}>
            {(props) => (
              <Input
                {...props}
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="11.3216"
              />
            )}
          </Field>
          <Field label="Longitude" error={errorFor("longitude")}>
            {(props) => (
              <Input
                {...props}
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="75.9336"
              />
            )}
          </Field>
        </div>
      </div>
    </Modal>
  );
}
