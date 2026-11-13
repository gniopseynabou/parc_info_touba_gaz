"use client";

import React, { useState } from "react";
import {
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  TrendingUp,
  Layers,
  BarChart2,
  PieChart,
  Timer,
  ChevronRight,
  Flame,
} from "lucide-react";
import { formatDateFr } from "@/lib/constants";

export interface SemaineInterventionStat {
  semaineKey: string;
  semaineLabel: string;
  annee: number;
  semaineNumero: number;
  debutSemaine: string;
  finSemaine: string;
  count: number;
  interventionsAvecDuree: number;
  dureeMinutesTotale: number;
  dureeHeuresTotale: number;
  dureeMoyenneMinutes: number;
  dureeMoyenneHeures: number;
}

export interface GraphiquesData {
  equipementsParEtat: Record<string, number>;
  equipementsParType: { type: string; count: number }[];
  ticketsEvolution: { date: string; count: number }[];
  prioritesCount: Record<string, number>;
  statutsCount: Record<string, number>;
  interventionsEvolution: { date: string; count: number; duree: number }[];
  interventionsParSemaine?: SemaineInterventionStat[];
}

export function RapportCharts({ data }: { data: GraphiquesData }) {
  const semaines = data.interventionsParSemaine || [];
  
  // Par défaut : sélectionner la dernière semaine ou la plus récente
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(
    semaines.length > 0 ? semaines.length - 1 : 0
  );

  // Helper de durée lisible (ex: "3 h 50 min" ou "30 min")
  const formatDureePretty = (minutesTotal: number) => {
    if (!minutesTotal || minutesTotal <= 0) return "0 min";
    const h = Math.floor(minutesTotal / 60);
    const m = Math.round(minutesTotal % 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m.toString().padStart(2, "0")} min`;
  };

  // Calculs globaux
  const totalDureeCumuleeMinutes = semaines.reduce((acc, s) => acc + s.dureeMinutesTotale, 0);
  const totalInterventions = semaines.reduce((acc, s) => acc + s.count, 0);
  const totalInterventionsAvecDuree = semaines.reduce((acc, s) => acc + s.interventionsAvecDuree, 0);
  const moyenneGlobaleMinutes = totalInterventionsAvecDuree > 0
    ? Math.round(totalDureeCumuleeMinutes / totalInterventionsAvecDuree)
    : 0;

  // Calcul pour la semaine actuellement sélectionnée
  const activeWeek = semaines[selectedWeekIndex] || semaines[0];
  const maxSemaineHeures = Math.max(...semaines.map((s) => s.dureeHeuresTotale), 0.1);

  // ==========================================
  // CONFIGURATIONS ÉQUIPEMENTS & TICKETS
  // ==========================================
  const totalEquipements = Object.values(data.equipementsParEtat || {}).reduce(
    (a, b) => a + b,
    0
  );
  const etatsConfig = [
    {
      key: "en_service",
      label: "En service",
      count: data.equipementsParEtat?.en_service || 0,
      color: "#16A34A",
    },
    {
      key: "en_panne",
      label: "En panne",
      count: data.equipementsParEtat?.en_panne || 0,
      color: "#DC2626",
    },
    {
      key: "en_maintenance",
      label: "En maintenance",
      count: data.equipementsParEtat?.en_maintenance || 0,
      color: "#D97706",
    },
    {
      key: "hors_service",
      label: "Hors service",
      count: data.equipementsParEtat?.hors_service || 0,
      color: "#475569",
    },
  ];

  const maxTypeCount = Math.max(
    ...(data.equipementsParType || []).map((t) => t.count),
    1
  );

  const prioritesConfig = [
    {
      key: "basse",
      label: "Basse",
      count: data.prioritesCount?.basse || 0,
      color: "#16A34A",
    },
    {
      key: "normale",
      label: "Normale",
      count: data.prioritesCount?.normale || 0,
      color: "#2563EB",
    },
    {
      key: "haute",
      label: "Haute",
      count: data.prioritesCount?.haute || 0,
      color: "#D97706",
    },
    {
      key: "critique",
      label: "Critique",
      count: data.prioritesCount?.critique || 0,
      color: "#DC2626",
    },
  ];
  const totalPriorites = prioritesConfig.reduce((a, b) => a + b.count, 0);

  const statutsConfig = [
    {
      key: "nouveau",
      label: "Nouveau",
      count: data.statutsCount?.nouveau || 0,
      color: "#0284C7",
    },
    {
      key: "en_cours",
      label: "En cours",
      count: data.statutsCount?.en_cours || 0,
      color: "#D97706",
    },
    {
      key: "en_attente",
      label: "En attente",
      count: data.statutsCount?.en_attente || 0,
      color: "#9333EA",
    },
    {
      key: "resolu",
      label: "Résolu",
      count: data.statutsCount?.resolu || 0,
      color: "#16A34A",
    },
    {
      key: "cloture",
      label: "Clôturé",
      count: data.statutsCount?.cloture || 0,
      color: "#475569",
    },
  ];
  const totalStatuts = statutsConfig.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* ======================================================== */}
      {/* 1. DIAGRAMME PRINCIPAL ÉPURÉ & MODERNE (DURÉE PAR SEMAINE) */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        {/* En-tête limpide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Clock className="size-4 text-emerald-800" />
              </span>
              <h4 className="text-base font-extrabold text-slate-950 tracking-tight">
                Durée des interventions par semaine
              </h4>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-700">
              Suivi hebdomadaire du temps d'assistance passé par l'équipe IT
            </p>
          </div>

          {/* 3 mini badges clés ultra lisibles */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">Volume total</span>
              <span className="font-extrabold text-slate-950 tabular-nums">
                {totalInterventions} interv.
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">Temps cumulé</span>
              <span className="font-extrabold text-emerald-800 tabular-nums">
                {formatDureePretty(totalDureeCumuleeMinutes)}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-950">Moyenne</span>
              <span className="font-extrabold text-emerald-950 tabular-nums">
                {formatDureePretty(moyenneGlobaleMinutes)} / interv.
              </span>
            </div>
          </div>
        </div>

        {semaines.length === 0 ? (
          <div className="py-14 text-center text-xs font-semibold text-slate-600 italic">
            Aucune intervention enregistrée pour la période filtrée.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Visualisation épurée en colonnes minimalistes interactives */}
            <div className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {semaines.map((s, idx) => {
                  const isSelected = selectedWeekIndex === idx;
                  const barHeightPct = Math.max(
                    Math.round((s.dureeHeuresTotale / maxSemaineHeures) * 100),
                    8
                  );

                  return (
                    <button
                      key={s.semaineKey}
                      type="button"
                      onClick={() => setSelectedWeekIndex(idx)}
                      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                          : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      {/* Header de la carte semaine */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-extrabold ${
                            isSelected ? "text-emerald-900" : "text-slate-950"
                          }`}
                        >
                          {s.semaineLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-emerald-200/80 text-emerald-950"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {s.count} {s.count > 1 ? "act." : "act."}
                        </span>
                      </div>

                      {/* Mini barre de progression proportionnelle */}
                      <div className="my-3 h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? "bg-emerald-600" : "bg-slate-700"
                          }`}
                          style={{ width: `${barHeightPct}%` }}
                        />
                      </div>

                      {/* Durée en gros et très lisible */}
                      <div>
                        <p
                          className={`text-sm font-extrabold tracking-tight ${
                            isSelected ? "text-emerald-950" : "text-slate-950"
                          }`}
                        >
                          {s.dureeHeuresTotale > 0 ? `${s.dureeHeuresTotale} h` : "0 min"}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                          {s.debutSemaine.slice(5)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fiche focus détaillée de la semaine sélectionnée (100% claire, zéro surcharge) */}
            {activeWeek && (
              <div className="rounded-xl bg-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in-50">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Timer className="size-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-white">
                      Semaine {activeWeek.semaineNumero} ({activeWeek.annee})
                    </h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Période du {formatDateFr(activeWeek.debutSemaine)} au {formatDateFr(activeWeek.finSemaine)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 sm:gap-8 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-8">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Interventions
                    </span>
                    <span className="text-base font-extrabold text-white mt-0.5 block tabular-nums">
                      {activeWeek.count}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Durée totale
                    </span>
                    <span className="text-base font-extrabold text-emerald-400 mt-0.5 block tabular-nums">
                      {formatDureePretty(activeWeek.dureeMinutesTotale)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Moyenne / act.
                    </span>
                    <span className="text-base font-extrabold text-white mt-0.5 block tabular-nums">
                      {formatDureePretty(activeWeek.dureeMoyenneMinutes)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. GRILLE DES AUTRES DIAGRAMMES (LISIBILITÉ MAXIMALE) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* A. Équipements par état */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <Laptop className="size-4 text-emerald-700" />
              A. Équipements par état
            </h4>
            <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-950">
              {totalEquipements} total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
              {etatsConfig.map((item) => {
                const pct = totalEquipements > 0 ? (item.count / totalEquipements) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={item.key}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full"
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {etatsConfig.map((item) => {
                const pct = totalEquipements > 0
                  ? Math.round((item.count / totalEquipements) * 100)
                  : 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs border border-slate-200"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-slate-950 truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-950 ml-1">
                      {item.count}{" "}
                      <span className="text-[10px] text-slate-700 font-semibold">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* B. Équipements par type */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <Layers className="size-4 text-emerald-700" />
              B. Équipements par catégorie
            </h4>
          </div>

          <div className="mt-4 space-y-3">
            {(data.equipementsParType || []).slice(0, 5).map((item) => {
              const pct = Math.round((item.count / maxTypeCount) * 100);
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-950 truncate max-w-[160px]">
                      {item.type}
                    </span>
                    <span className="font-extrabold text-slate-950 tabular-nums">
                      {item.count}{" "}
                      <span className="text-[10px] text-slate-700 font-semibold">
                        unités
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Tickets par priorité */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-600" />
              C. Tickets par priorité
            </h4>
            <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-950">
              {totalPriorites} total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {prioritesConfig.map((item) => {
              const pct = totalPriorites > 0 ? Math.round((item.count / totalPriorites) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-950 flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="font-extrabold text-slate-950 tabular-nums">
                      {item.count}{" "}
                      <span className="text-[10px] text-slate-700 font-semibold">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* D. Tickets par statut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <PieChart className="size-4 text-emerald-700" />
              D. Tickets par statut
            </h4>
            <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-950">
              {totalStatuts} total
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {statutsConfig.map((item) => {
              const pct = totalStatuts > 0 ? Math.round((item.count / totalStatuts) * 100) : 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-950">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-950 tabular-nums">{item.count}</span>
                    <span className="text-[10px] text-slate-700 font-semibold">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* E. Évolution des tickets créés */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <BarChart2 className="size-4 text-sky-700" />
              E. Volume chronologique des demandes d'assistance
            </h4>
          </div>

          {(data.ticketsEvolution || []).length === 0 ? (
            <p className="py-10 text-center text-xs font-semibold text-slate-600 italic">
              Aucun ticket sur cette période.
            </p>
          ) : (
            <div className="mt-4 flex items-end gap-2 h-32 pt-4 border-b border-slate-200">
              {(data.ticketsEvolution || []).map((item) => {
                const maxTicket = Math.max(...(data.ticketsEvolution || []).map((t) => t.count), 1);
                const heightPct = Math.round((item.count / maxTicket) * 100);
                return (
                  <div
                    key={item.date}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    <div className="pointer-events-none absolute -top-8 hidden group-hover:flex flex-col items-center z-20">
                      <span className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                        {item.count} tickets ({item.date.slice(5)})
                      </span>
                    </div>
                    <div
                      style={{ height: `${Math.max(heightPct, 15)}%` }}
                      className="w-full rounded-t-md bg-sky-600 hover:bg-sky-700 transition-all cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-950 truncate mt-1.5 w-full text-center">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
