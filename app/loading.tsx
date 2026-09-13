import Spinner from "@/components/ui/Spinner";

/** Streaming fallback so route transitions show something rather than nothing. */
export default function RouteLoading() {
  return (
    <div className="flex items-center justify-center px-6 py-24 text-muted-foreground">
      <Spinner className="h-5 w-5" />
    </div>
  );
}
