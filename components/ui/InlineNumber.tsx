"use client";

import { useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/Input";

/**
 * An editable number that only submits on an actual change, so tabbing
 * through the table does not fire a write per cell.
 */
export default function InlineNumber({
  initial,
  suffix,
  disabled,
  onCommit,
}: {
  initial: string;
  suffix?: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        value={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== initial) onCommit(value);
        }}
        className="h-8 w-24 text-right"
      />
      {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}
