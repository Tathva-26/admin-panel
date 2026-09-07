/**
 * Placeholder for a section whose screens have not landed yet.
 *
 * Temporary by design — each section deletes its own usage when that section is
 * built, and this file goes with the last one.
 */
export default function NotBuiltYet({ owner }: { owner?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-zinc-700">Not built yet</p>
      <p className="mt-1 text-sm text-zinc-500">
        The route and navigation are wired up; the screens come next
        {owner ? ` (${owner})` : ""}.
      </p>
    </div>
  );
}
