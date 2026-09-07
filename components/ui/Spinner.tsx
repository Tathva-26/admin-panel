import { cn } from "@/lib/cn";

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]",
        className ?? "h-4 w-4",
      )}
    />
  );
}
