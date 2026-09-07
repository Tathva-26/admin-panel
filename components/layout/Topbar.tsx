/**
 * Deliberately not a copy of the page title — that lives in PageHeader.
 *
 * What is actually useful in the chrome of an internal tool is knowing which
 * backend you are pointed at, since that is the first question when a screen
 * is empty.
 */
export default function Topbar() {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-zinc-200 bg-white px-6">
      <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
        Auth disabled
      </span>
      <span className="numeric text-xs text-zinc-500">{apiOrigin}/api</span>
    </header>
  );
}
