"use client";

import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  ChevronRight,
  LogOut,
  Search,
  Laptop,
  Share2,
  LifeBuoy,
  Users,
  Building2,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserInitials } from "@/lib/utils";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Accueil",
  "/dashboard/equipements": "Équipements",
  "/dashboard/affectations": "Affectations",
  "/dashboard/tickets": "Tickets d'assistance",
  "/dashboard/employes": "Employés",
  "/dashboard/services": "Services",
  "/dashboard/rapports": "Rapports & Statistiques",
};

const QUICK_LINKS = [
  { label: "Équipements", href: "/dashboard/equipements", icon: Laptop },
  { label: "Affectations", href: "/dashboard/affectations", icon: Share2 },
  { label: "Tickets d'assistance", href: "/dashboard/tickets", icon: LifeBuoy },
  { label: "Collaborateurs", href: "/dashboard/employes", icon: Users },
  { label: "Services", href: "/dashboard/services", icon: Building2 },
  { label: "Rapports d'activité", href: "/dashboard/rapports", icon: BarChart3 },
];

export function Topbar({
  isExpanded,
  onToggleExpand,
}: {
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Touba Gaz IT");
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    // 1. Essai localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("touba_gaz_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.nom) setUserName(user.nom);
          if (user.role) {
            setUserRole(user.role === "ADMIN" || user.role === "admin" ? "Administrateur IT" : "Collaborateur");
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Vérification session serveur via /api/auth/me
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          if (data.user.nom) setUserName(data.user.nom);
          if (data.user.role) {
            setUserRole(data.user.role === "admin" ? "Administrateur IT" : "Collaborateur");
          }
        }
      })
      .catch(() => {});
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

  const initials = getUserInitials(userName);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Côté gauche : Bouton Chevron '>' toggle + Menu déroulant des Liens Rapides */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          title={isExpanded ? "Réduire le menu" : "Déployer le menu"}
        >
          <ChevronRight
            className={`size-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>


      </div>

      {/* Côté droit : Cloche notifications administrateur + Avatar circulaire de l'utilisateur connecté */}
      <div className="flex items-center gap-3">
        {/* Cloche de notifications IT (conservée pour l'administrateur) */}
        <NotificationBell />

        {/* 7. Avatar avec initiales dynamiques et menu profil */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer">
            <div
              className="flex size-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-xs text-emerald-800 ring-2 ring-emerald-200 hover:ring-emerald-400 transition-all cursor-pointer"
              title={userName}
            >
              {initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56 p-1.5">
            <DropdownMenuLabel className="p-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 truncate">{userName}</span>
                <span className="text-[11px] text-emerald-700 font-medium">{userRole} · Touba Gaz SA</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="text-xs cursor-pointer">
              Tableau de bord
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/equipements")} className="text-xs cursor-pointer">
              Parc des équipements
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/tickets")} className="text-xs cursor-pointer">
              Tickets d'assistance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
