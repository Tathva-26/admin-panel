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
        "rounded-md border border-zinc-200 bg-white p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
