"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Flame,
  LayoutDashboard,
  Laptop,
  LifeBuoy,
  LogOut,
  Share2,
  Users,
  FileText,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { title: "Accueil", url: "/dashboard", icon: LayoutDashboard },
  { title: "Équipements", url: "/dashboard/equipements", icon: Laptop },
  { title: "Affectations", url: "/dashboard/affectations", icon: Share2 },
  { title: "Tickets d'assistance", url: "/dashboard/tickets", icon: LifeBuoy },
  { title: "Employés", url: "/dashboard/employes", icon: Users },
  { title: "Services", url: "/dashboard/services", icon: Building2 },
  { title: "Rapports & Statistiques", url: "/dashboard/rapports", icon: BarChart3 },
];

export function AppSidebar({
  isExpanded,
  onToggleExpand,
}: {
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = React.useState("Administrateur IT");
  const [userRole, setUserRole] = React.useState("IT Admin");
  const [userEmail, setUserEmail] = React.useState("admin@toubagaz.sn");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("touba_gaz_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.nom) setUserName(user.nom);
          if (user.role) {
            setUserRole(user.role === "ADMIN" || user.role === "admin" ? "Administrateur IT" : "Employé");
          }
          if (user.email) setUserEmail(user.email);
        } catch {
          // ignore
        }
      }
    }

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          if (data.user.nom) setUserName(data.user.nom);
          if (data.user.role) {
            setUserRole(data.user.role === "admin" ? "Administrateur IT" : "Employé");
          }
          if (data.user.email) setUserEmail(data.user.email);
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
    <TooltipProvider delay={80}>
      <aside
        aria-label="Navigation principale"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-200 bg-white transition-[width] duration-200 ease-in-out lg:static ${
          isExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* En-tête : Logo Touba Gaz + Bouton chevron toggle */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Touba Gaz IT"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 shadow-2xs">
              <Flame className="size-5" />
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <span className="truncate text-sm font-bold tracking-tight text-slate-900 block">
                  TOUBA GAZ
                </span>
                <span className="truncate text-[11px] font-semibold text-emerald-600 block">
                  Parc Informatique
                </span>
              </div>
            )}
          </Link>

          {isExpanded && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Réduire le menu"
            >
              <ChevronRight className="size-4 rotate-180 transition-transform" />
            </button>
          )}
        </div>

        {/* Corps de navigation : Menu avec infobulles au survol */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url !== "/dashboard" && pathname.startsWith(item.url));
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.url}
                  className={`group relative flex items-center rounded-xl p-2.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isExpanded ? "gap-3 px-3 justify-start" : "justify-center"
                  } ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-200/80 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "text-emerald-700" : "text-slate-600"
                    }`}
                  />
                  {isExpanded && (
                    <span className="truncate text-sm font-medium">
                      {item.title}
                    </span>
                  )}
                  {isActive && !isExpanded && (
                    <span className="absolute -left-2 h-5 w-1 rounded-r-full bg-emerald-600" />
                  )}
                </Link>
              );

              // Si le menu est en mode icône (comme sur la photo), l'infobulle affiche le titre au survol du curseur
              if (!isExpanded) {
                return (
                  <Tooltip key={item.url}>
                    <TooltipTrigger render={linkContent} />
                    <TooltipContent
                      side="right"
                      sideOffset={10}
                      className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.url}>{linkContent}</div>;
            })}
          </nav>
        </div>

        {/* Pied de page : Profil utilisateur & Bouton Déconnexion */}
        <div className="shrink-0 border-t border-slate-100 p-2.5 space-y-2">
          {/* Menu déroulant profil avec Tooltip au survol et Déconnexion au clic (Items 3 & 4) */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    title={`${userName} — ${userRole}`}
                    className={`flex w-full items-center rounded-xl p-1.5 transition-colors hover:bg-slate-100 focus:bg-slate-100 outline-none cursor-pointer ${
                      isExpanded ? "gap-2.5" : "justify-center"
                    }`}
                  >
                    <Avatar className="size-9 rounded-xl">
                      <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold rounded-xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isExpanded && (
                      <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                        <span className="truncate font-semibold text-slate-900">
                          {userName}
                        </span>
                        <span className="truncate text-[11px] text-slate-500">
                          {userRole}
                        </span>
                      </div>
                    )}
                  </DropdownMenuTrigger>
                }
              />
              {!isExpanded && (
                <TooltipContent
                  side="right"
                  sideOffset={10}
                  className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl z-50 min-w-36"
                >
                  <p className="font-bold text-white leading-tight">{userName}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 leading-tight">{userRole}</p>
                </TooltipContent>
              )}
            </Tooltip>
            <DropdownMenuContent
              side={isExpanded ? "top" : "right"}
              align="start"
              sideOffset={10}
              className="w-56 p-1.5 shadow-lg"
            >
              <DropdownMenuLabel className="p-2.5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{userName}</span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5">{userRole}</span>
                  <span className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Tableau de bord</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/rapports")}>
                  <FileText className="size-4 text-slate-500" />
                  <span>Rapports d'activité</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer flex items-center gap-2 p-2 rounded-lg font-medium"
              >
                <LogOut className="size-4 text-rose-600" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bouton direct Déconnexion au bas de l'icône rail (comme sur la photo) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center justify-center rounded-xl p-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-200/80 ${
                    isExpanded ? "gap-2" : ""
                  }`}
                  aria-label="Se déconnecter"
                >
                  <LogOut className="size-4 shrink-0" />
                  {isExpanded && <span className="text-xs font-semibold">Déconnexion</span>}
                </button>
              }
            />
            {!isExpanded && (
              <TooltipContent
                side="right"
                sideOffset={10}
                className="bg-rose-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg z-50"
              >
                Se déconnecter
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
