import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/components/ui/Badge";

export interface Segment {
  label: string;
  value: number;
  tone: BadgeTone;
}

/** Solid fills for the bar, keyed to the same tones the badges use. */
const FILLS: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-destructive",
  blue: "bg-info",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-muted-foreground",
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-destructive",
  blue: "bg-info",
};

interface DistributionBarProps {
  segments: Segment[];
  /** Shown at the right of the legend row — a total, a sum of money, anything. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * One bar showing how a list splits across states, with the counts underneath.
 *
 * The point is the shape: "most of these failed" reads instantly here and not
 * at all from a column of badges. Zero-value segments are dropped from the bar
 * but kept in the legend, so a status at zero is visibly zero rather than
 * missing.
 */
export default function DistributionBar({
  segments,
  trailing,
  className,
}: DistributionBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2.5",
        className,
      )}
    >
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
        {total === 0
          ? null
          : segments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <div
                  key={segment.label}
                  className={cn("h-full", FILLS[segment.tone])}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                  title={`${segment.label}: ${segment.value}`}
                />
              ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                segment.value > 0 ? DOTS[segment.tone] : "bg-muted",
              )}
            />
            {segment.label}
            <span className="numeric font-medium text-foreground">
              {segment.value}
            </span>
          </span>
        ))}

        {trailing ? <span className="ml-auto">{trailing}</span> : null}
      </div>
    </div>
  );
}
