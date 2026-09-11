import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  green: "border-success/40 bg-success/15 text-success",
  amber: "border-warning/40 bg-warning/15 text-warning",
  red: "border-destructive bg-destructive/10 text-destructive",
  blue: "border-info/40 bg-info/15 text-info",
};

export default function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
