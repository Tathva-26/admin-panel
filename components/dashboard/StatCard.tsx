import Card from "@/components/ui/Card";

export interface SubStat {
  label: string;
  value: number;
}

export default function StatCard({
  label,
  value,
  subStats = [],
  loading = false,
}: {
  label: string;
  value: number | null;
  subStats?: SubStat[];
  loading?: boolean;
}) {
  return (
    <Card>
      <p className="text-xs tracking-wide text-zinc-500 uppercase">{label}</p>

      {loading ? (
        <span className="mt-2 block h-8 w-20 animate-pulse rounded bg-zinc-100" />
      ) : (
        <p className="numeric mt-1 text-3xl font-semibold text-zinc-900">
          {value ?? "—"}
        </p>
      )}

      {subStats.length > 0 && !loading ? (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-2.5">
          {subStats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <dt className="text-xs text-zinc-500">{stat.label}</dt>
              <dd className="numeric text-xs font-medium text-zinc-800">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Card>
  );
}
