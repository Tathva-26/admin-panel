import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export default function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white",
        className ?? "p-4",
      )}
    >
      {children}
    </div>
  );
}
