"use client";

import { Suspense, useState, useEffect } from "react";
import { Menu, LogOut, User, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const [userName, setUserName] = useState("Administrateur IT");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("touba_gaz_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.nom) setUserName(user.nom);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("touba_gaz_user");
    }
    toast.success("Déconnexion réussie.");
    router.push("/");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/90 bg-[#0b1220]/95 px-4 sm:px-6 lg:px-8">
      {/* Côté gauche : Breadcrumb & Menu Mobile */}
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

      {/* Côté droit : Profil Admin et Bouton Déconnexion clair et visible */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <Shield className="h-3.5 w-3.5 text-green-400" />
          <span className="text-slate-200 font-medium truncate max-w-[150px]">{userName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-400 font-semibold">
            Admin
          </span>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white transition-colors"
          title="Se déconnecter de la session"
        >
          <LogOut className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-semibold">Déconnexion</span>
        </Button>
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
