import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-accent disabled:hover:bg-primary",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted disabled:hover:bg-card",
  danger: "bg-destructive text-primary-foreground hover:bg-destructive disabled:hover:bg-destructive",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
};

/**
 * The button look, separated from the `<button>` element.
 *
 * Some actions are navigations and must render as `<a>` — a "New event" button
 * that links to the create URL, for instance. Those need these styles without
 * inheriting button semantics, and reimplementing them inline is how the topbar
 * ended up with its own not-quite-matching buttons.
 */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium",
    "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks further clicks. */
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // A pending request should not be submittable twice.
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}
