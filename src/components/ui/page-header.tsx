import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
              <Icon className="size-4" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 pt-1 sm:pt-0">
          {children}
        </div>
      )}
    </div>
  );
}
