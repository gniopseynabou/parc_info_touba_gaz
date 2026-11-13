"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Flame,
  LayoutDashboard,
  Laptop,
  LifeBuoy,
  Share2,
  Users,
  X,
  FileText,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
  { label: "Équipements", href: "/dashboard/equipements", icon: Laptop },
  { label: "Affectations", href: "/dashboard/affectations", icon: Share2 },
  { label: "Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
  { label: "Employés", href: "/dashboard/employes", icon: Users },
  { label: "Services", href: "/dashboard/services", icon: Building2 },
  { label: "Rapports d'activité", href: "/dashboard/rapports", icon: FileText },
];

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
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
    <aside
      aria-label="Navigation principale"
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(18rem,88vw)] shrink-0 flex-col border-r border-[#E2E8F0] bg-white text-slate-700 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* En-tête de marque Touba Gaz IT */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] px-4 bg-white">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Image
            src="/logo.png"
            alt="Touba Gaz"
            width={150}
            height={50}
            className="h-11 w-auto object-contain"
            priority
          />
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Fermer le menu"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 lg:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation principale avec scrollbar indépendante */}
      <nav id="primary-navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Espace de travail
        </p>
        <Suspense fallback={<NavigationFallback />}>
          <NavigationItems onNavigate={onNavigate} />
        </Suspense>
      </nav>

      {/* Pied de sidebar toujours visible en bas */}
      <div className="shrink-0 border-t border-[#E2E8F0] p-3 space-y-2 bg-[#F8FAFC]">
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500">Administrateur connecté</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors shadow-2xs"
          title="Fermer la session actuelle"
        >
          <LogOut className="h-3.5 w-3.5 text-rose-600" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}

function NavigationItems({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();

  return NAV_ITEMS.map((item) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive
            ? "bg-[#DCFCE7] text-[#15803D] font-semibold ring-1 ring-inset ring-emerald-300/40"
            : "font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
        }`}
      >
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors ${
            isActive
              ? "text-[#16A34A]"
              : "text-slate-400 group-hover:text-slate-600"
          }`}
          aria-hidden="true"
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  });
}

function NavigationFallback() {
  return NAV_ITEMS.map((item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        tabIndex={-1}
        aria-hidden="true"
        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs sm:text-sm font-medium text-slate-400"
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-300" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  });
}
