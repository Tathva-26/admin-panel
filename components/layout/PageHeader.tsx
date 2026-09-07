import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary actions for the page, e.g. a "New event" button. */
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
