import type { ReactNode } from "react";
import { useId } from "react";

interface FieldProps {
  label: string;
  /** Message from `fieldErrors()`, shown under the control. */
  error?: string;
  hint?: string;
  required?: boolean;
  /** Receives the generated id so the label points at the right control. */
  children: (props: { id: string; "aria-invalid"?: true }) => ReactNode;
}

/**
 * Label, control and validation message as one unit.
 *
 * Takes a render function so it can hand down a generated id and the invalid
 * flag — that way a 422 from the backend shows next to the right input without
 * every form wiring up ids by hand.
 */
export default function Field({
  label,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-zinc-700"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>

      {children({ id, ...(error ? { "aria-invalid": true as const } : {}) })}

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
