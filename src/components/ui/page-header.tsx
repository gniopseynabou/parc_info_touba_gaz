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
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-white sm:text-[26px]">
          <Icon className="h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
          <span>{title}</span>
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      )}
    </header>
  );
}
