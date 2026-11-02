"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Petit Client Component isolé pour le bouton Actualiser du dashboard.
 *  Le reste de la page reste un Server Component (chargement instantané). */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    // Stoppe l'animation après 800ms même si la navigation est rapide
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending}
      className="h-10 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
    >
      <RefreshCw className={`h-4 w-4 ${spinning || isPending ? "animate-spin" : ""}`} aria-hidden="true" />
      Actualiser
    </Button>
  );
}
