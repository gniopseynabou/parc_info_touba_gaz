"use client";

import { Suspense } from "react";
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
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] shrink-0 flex-col border-r border-slate-800 bg-[#0b1220] text-slate-200 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400 ring-1 ring-green-500/25">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold tracking-wide text-white">
                  TOUBA GAZ
                </span>
                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-semibold text-green-300">
                  IT
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Gestion du parc</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Fermer le menu"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav id="primary-navigation" className="space-y-1 px-3 py-5">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Espace de travail
          </p>
          <Suspense fallback={<NavigationFallback />}>
            <NavigationItems onNavigate={onNavigate} />
          </Suspense>
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800/80 p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">Support informatique</p>
            <p className="mt-0.5 text-xs text-slate-400">Portail de gestion IT</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
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
        className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
          isActive
            ? "bg-green-600/15 text-green-300 ring-1 ring-inset ring-green-500/20"
            : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${
            isActive
              ? "text-green-400"
              : "text-slate-500 group-hover:text-slate-300"
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
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400"
      >
        <Icon className="h-[18px] w-[18px] shrink-0 text-slate-500" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  });
}
