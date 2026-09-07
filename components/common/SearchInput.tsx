"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/Input";

interface SearchInputProps {
  /** Current value from the URL. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Milliseconds to wait after the last keystroke. */
  delay?: number;
}

/**
 * Debounced so a search does not put one history entry — and one request — on
 * the wire per keystroke.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  delay = 350,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Keep up with the URL changing underneath us — back button, or a filter
  // cleared elsewhere on the page. Adjusting during render rather than in an
  // effect avoids a second render pass with the stale value on screen.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;

    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, delay, onChange]);

  return (
    <Input
      type="search"
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      className="h-9 w-full text-sm sm:h-8 sm:w-56"
    />
  );
}
