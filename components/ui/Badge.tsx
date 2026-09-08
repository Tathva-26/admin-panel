import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-zinc-200 bg-zinc-100 text-zinc-800",
  green: "border-green-200 bg-green-100 text-green-900",
  amber: "border-amber-200 bg-amber-100 text-amber-900",
  red: "border-red-200 bg-red-100 text-red-900",
  blue: "border-blue-200 bg-blue-100 text-blue-900",
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
