"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Accueil",
  "/dashboard/equipements": "Équipements",
  "/dashboard/affectations": "Affectations",
  "/dashboard/tickets": "Tickets d'assistance",
  "/dashboard/employes": "Employés",
  "/dashboard/services": "Services",
  "/dashboard/rapports": "Rapports & Statistiques",
};

export function Shell({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const currentTitle =
    BREADCRUMB_MAP[pathname] ||
    (pathname.startsWith("/dashboard/equipements/")
      ? "Fiche Équipement"
      : "Parc Informatique");

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50/60 text-slate-800">
      {/* Fond sombre translucide sur mobile lorsque la barre latérale est déployée */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Barre latérale icône-seule réactive */}
      <AppSidebar
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
      />

      {/* Conteneur principal (décalé de 4rem sur mobile pour ne pas être masqué par la barre fixe) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pl-16 lg:pl-0">
        <Topbar
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((prev) => !prev)}
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-6">
            {/* Fil d'ariane officiel 'Accueil > [Titre]' comme sur la photo de référence */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link
                href="/dashboard"
                className="hover:text-emerald-700 transition-colors"
              >
                Accueil
              </Link>
              <span className="text-slate-300">›</span>
              <span className="font-semibold text-slate-800">
                {currentTitle}
              </span>
            </div>

            {children}

            {/* Pied de page officiel Touba Gaz (comme sur la photo) */}
            <footer className="pt-6 pb-2 text-xs text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
              <p>
                © Copyright 2026. Tous droits réservés{" "}
                <span className="font-semibold text-slate-700 underline decoration-slate-300">
                  Touba Gaz SA
                </span>
                .
              </p>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Direction des Systèmes d'Information
              </p>
            </footer>
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
