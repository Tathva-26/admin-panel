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
  const [location, setLocation] = useState(venue?.location ?? "");
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
      location: location.trim() || null,
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

        <Field label="Location" error={errorFor("location")}>
          {(props) => (
            <Input
              {...props}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Academic Block, NIT Calicut"
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}
