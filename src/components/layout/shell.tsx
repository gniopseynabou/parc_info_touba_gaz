"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0b1220] text-slate-100">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={mobileOpen}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#0e1728] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
