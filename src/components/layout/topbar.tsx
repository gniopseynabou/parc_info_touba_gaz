"use client";

import { Suspense } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Vue d’ensemble",
  "/dashboard/equipements": "Équipements",
  "/dashboard/affectations": "Affectations",
  "/dashboard/tickets": "Tickets",
  "/dashboard/employes": "Employés",
  "/dashboard/services": "Services",
  "/dashboard/rapports": "Rapports d'activité",
};

export function Topbar({
  onOpenMenu,
  isMenuOpen,
}: {
  onOpenMenu: () => void;
  isMenuOpen: boolean;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#0b1220]/95 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-slate-500 sm:inline">Touba Gaz</span>
          <span className="hidden text-slate-600 sm:inline">/</span>
          <Suspense fallback={<span className="text-slate-400">Espace IT</span>}>
            <CurrentBreadcrumb />
          </Suspense>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="hidden sm:inline">Portail informatique</span>
      </div>
    </header>
  );
}

function CurrentBreadcrumb() {
  const pathname = usePathname();
  const currentTitle =
    BREADCRUMB_MAP[pathname] ||
    (pathname.startsWith("/dashboard/equipements/") ? "Fiche équipement" : "Espace IT");

  return <span className="truncate font-medium text-slate-200">{currentTitle}</span>;
}
