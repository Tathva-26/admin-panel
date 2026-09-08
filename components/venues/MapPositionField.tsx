"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
  googleMapsUrl,
  isShortMapsLink,
  osmEmbedUrl,
  parseLatLng,
  type LatLng,
} from "@/lib/geo";

interface MapPositionFieldProps {
  value: LatLng | null;
  onChange: (next: LatLng | null) => void;
  error?: string;
}

/**
 * Takes a pasted Google Maps link instead of asking for two numbers.
 *
 * Typing coordinates by hand is the kind of task where a transposed digit
 * silently puts a venue in the sea, and nobody notices until someone follows
 * the map. Pasting a link is what an admin would do anyway, and the preview
 * means a wrong pin is obvious immediately rather than at the fest.
 */
export default function MapPositionField({
  value,
  onChange,
  error,
}: MapPositionFieldProps) {
  const [raw, setRaw] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  /**
   * `announce` decides whether a failure is worth saying out loud. Typing
   * "11.3213, 75.9331" passes through a dozen states that are not yet valid,
   * and flashing a red error at each one would be scolding someone for not
   * having finished. So the complaint waits for blur or a paste — the moments
   * the input is actually meant to be complete.
   */
  function apply(input: string, announce: boolean) {
    setRaw(input);
    setHint(null);

    if (!input.trim()) return;

    const parsed = parseLatLng(input);
    if (parsed) {
      onChange(parsed);
      setRaw("");
      return;
    }

    if (!announce) return;

    // A short link is the common near-miss, so it gets its own instruction
    // rather than a generic "could not read that".
    setHint(
      isShortMapsLink(input)
        ? "Short links can't be read here. Open it, then copy the full URL from the address bar."
        : "Couldn't find coordinates in that. Paste a full Google Maps URL, or type \"lat, lng\".",
    );
  }

  return (
    <div className="space-y-2">
      <Field
        label="Map position"
        error={error ?? hint ?? undefined}
        hint='Paste a Google Maps link, or type "11.3213, 75.9331".'
      >
        {(props) => (
          <Input
            {...props}
            value={raw}
            onChange={(e) => apply(e.target.value, false)}
            onBlur={(e) => apply(e.target.value, true)}
            onPaste={(e) => {
              // Read the pasted text directly so a link resolves on paste
              // rather than waiting for another keystroke.
              const text = e.clipboardData.getData("text");
              if (text) {
                e.preventDefault();
                apply(text, true);
              }
            }}
            placeholder="https://www.google.com/maps/place/…"
          />
        )}
      </Field>

      {value ? (
        <div className="overflow-hidden rounded-md border border-zinc-200">
          <iframe
            key={`${value.latitude},${value.longitude}`}
            title="Venue location preview"
            src={osmEmbedUrl(value)}
            className="block h-40 w-full border-0"
            loading="lazy"
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-200 bg-zinc-50 px-2.5 py-1.5">
            <span className="numeric text-xs text-zinc-600">
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </span>

            <a
              href={googleMapsUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline-offset-2 hover:underline"
            >
              Open in Google Maps
            </a>

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => {
                onChange(null);
                setRaw("");
                setHint(null);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-500">
          No position set — optional, but it puts the venue on the map.
        </p>
      )}
    </div>
  );
}
