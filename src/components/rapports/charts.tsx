"use client";

import React, { useState } from "react";
import {
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Ban,
  Clock,
  Flame,
  TrendingUp,
  Activity,
  Layers,
  BarChart2,
  PieChart,
} from "lucide-react";

interface GraphiquesData {
  equipementsParEtat: Record<string, number>;
  equipementsParType: { type: string; count: number }[];
  ticketsEvolution: { date: string; count: number }[];
  prioritesCount: Record<string, number>;
  statutsCount: Record<string, number>;
  interventionsEvolution: { date: string; count: number; duree: number }[];
}

export function RapportCharts({ data }: { data: GraphiquesData }) {
  const [hoveredTip, setHoveredTip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // A. Équipements par état
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
      bgClass: "bg-emerald-500",
    },
    {
      key: "en_panne",
      label: "En panne",
      count: data.equipementsParEtat?.en_panne || 0,
      color: "#E11D48",
      bgClass: "bg-rose-500",
    },
    {
      key: "en_maintenance",
      label: "En maintenance",
      count: data.equipementsParEtat?.en_maintenance || 0,
      color: "#D97706",
      bgClass: "bg-amber-500",
    },
    {
      key: "hors_service",
      label: "Hors service",
      count: data.equipementsParEtat?.hors_service || 0,
      color: "#64748B",
      bgClass: "bg-slate-500",
    },
  ];

  // B. Équipements par type
  const maxTypeCount = Math.max(
    ...(data.equipementsParType || []).map((t) => t.count),
    1
  );

  // C. Évolution des tickets
  const ticketsEvolution = data.ticketsEvolution || [];
  const maxTicketEvolution = Math.max(
    ...ticketsEvolution.map((t) => t.count),
    1
  );

  // D. Priorités des tickets
  const prioritesConfig = [
    {
      key: "basse",
      label: "Basse",
      count: data.prioritesCount?.basse || 0,
      color: "#10B981",
    },
    {
      key: "normale",
      label: "Normale",
      count: data.prioritesCount?.normale || 0,
      color: "#0284C7",
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

  // E. Statuts des tickets
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
      color: "#64748B",
    },
  ];
  const totalStatuts = statutsConfig.reduce((a, b) => a + b.count, 0);

  // F. Activité interventions
  const interventionsEvolution = data.interventionsEvolution || [];
  const maxInterventionCount = Math.max(
    ...interventionsEvolution.map((i) => i.count),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black flex items-center gap-2">
          <Activity className="size-4 text-emerald-600 print:text-black" />
          Graphiques d'activité & Visualisations décisionnelles
        </h3>
        <span className="text-xs text-slate-400 font-medium print:hidden">
          Données consolidées en temps réel
        </span>
      </div>

      {/* Grille des graphiques 2x3 responsive (Max 4 ou 6 cartes lisibles et aérées) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* GRAPHIQUE A : Répartition des équipements par état */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                A. Équipements par état
              </h4>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {totalEquipements} total
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Disponibilité opérationnelle du parc
            </p>

            {totalEquipements === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucun équipement enregistré.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Barre de répartition segmentée */}
                <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                  {etatsConfig.map((item) => {
                    const pct = (item.count / totalEquipements) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={item.key}
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                        className="h-full transition-all duration-300"
                        title={`${item.label} : ${item.count} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Légende détaillée avec valeurs */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {etatsConfig.map((item) => {
                    const pct = totalEquipements > 0
                      ? Math.round((item.count / totalEquipements) * 100)
                      : 0;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2 text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-600 truncate max-w-[80px]">
                            {item.label}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {item.count}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE B : Répartition des équipements par type */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                B. Équipements par type
              </h4>
              <Layers className="size-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Catégories matérielles réelles
            </p>

            {(!data.equipementsParType || data.equipementsParType.length === 0) ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucune catégorie d'équipement.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {data.equipementsParType.slice(0, 5).map((item) => {
                  const pct = Math.round((item.count / maxTypeCount) * 100);
                  return (
                    <div key={item.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[140px]">
                          {item.type}
                        </span>
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {item.count}{" "}
                          <span className="text-slate-400 text-[10px] font-normal">
                            unités
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE C : Évolution des demandes d'assistance */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                C. Évolution des tickets
              </h4>
              <TrendingUp className="size-4 text-sky-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Créations au fil de la période
            </p>

            {ticketsEvolution.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucun ticket sur cette période.
              </p>
            ) : (
              <div className="mt-4 flex items-end gap-2 h-36 pt-4 border-b border-slate-200">
                {ticketsEvolution.map((item) => {
                  const heightPct = Math.round(
                    (item.count / maxTicketEvolution) * 100
                  );
                  return (
                    <div
                      key={item.date}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {/* Infobulle survol */}
                      <div className="pointer-events-none absolute -top-8 hidden group-hover:flex flex-col items-center z-20">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap">
                          {item.count} tickets ({item.date.slice(5)})
                        </span>
                      </div>
                      <div
                        style={{ height: `${Math.max(heightPct, 12)}%` }}
                        className="w-full rounded-t-md bg-sky-500 hover:bg-sky-600 transition-all cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400 truncate mt-1 w-full text-center">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE D : Répartition des tickets par priorité */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                D. Tickets par priorité
              </h4>
              <AlertTriangle className="size-4 text-amber-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Niveaux d'urgence déclarés
            </p>

            {totalPriorites === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucun ticket disponible.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {prioritesConfig.map((item) => {
                  const pct = totalPriorites > 0
                    ? Math.round((item.count / totalPriorites) * 100)
                    : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-800">
                          {item.count}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE E : Répartition des tickets par statut */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                E. Tickets par statut
              </h4>
              <PieChart className="size-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Cycle de vie du traitement
            </p>

            {totalStatuts === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucun statut enregistré.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {statutsConfig.map((item) => {
                  const pct = totalStatuts > 0
                    ? Math.round((item.count / totalStatuts) * 100)
                    : 0;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-1.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-700">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.count}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE F : Activité des interventions de maintenance */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                F. Activité des interventions
              </h4>
              <Wrench className="size-4 text-purple-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Actions atelier & terrain
            </p>

            {interventionsEvolution.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400 italic">
                Aucune intervention sur cette période.
              </p>
            ) : (
              <div className="mt-4 flex items-end gap-2 h-36 pt-4 border-b border-slate-200">
                {interventionsEvolution.map((item) => {
                  const heightPct = Math.round(
                    (item.count / maxInterventionCount) * 100
                  );
                  return (
                    <div
                      key={item.date}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {/* Infobulle survol */}
                      <div className="pointer-events-none absolute -top-10 hidden group-hover:flex flex-col items-center z-20">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap">
                          {item.count} interv. ({item.duree} min)
                        </span>
                      </div>
                      <div
                        style={{ height: `${Math.max(heightPct, 15)}%` }}
                        className="w-full rounded-t-md bg-purple-500 hover:bg-purple-600 transition-all cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400 truncate mt-1 w-full text-center">
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
    </div>
  );
}
