import { cn } from "@/lib/cn";

/**
 * Muted enough to sit in a dense table without shouting, distinct enough that
 * the same person looks the same on every screen.
 */
const PALETTE = [
  "bg-red-100 text-red-700",
  "bg-amber-100 text-amber-700",
  "bg-green-100 text-green-700",
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
];

/** First and last initial: "Aditya Nair" → "AN", "Cher" → "C". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Deterministic so a person keeps their colour across pages and reloads —
 * a random one per render would make the list flicker and mean nothing.
 */
function paletteIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PALETTE.length;
}

interface AvatarProps {
  name: string;
  /** Keeps the colour stable when two people share a name. Defaults to the name. */
  seed?: string;
  className?: string;
}

export default function Avatar({ name, seed, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        PALETTE[paletteIndex(seed ?? name)],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
