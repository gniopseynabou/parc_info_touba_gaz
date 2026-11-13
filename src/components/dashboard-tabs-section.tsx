"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Laptop,
  LifeBuoy,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  formatDateFr,
  formatNumeroTicket,
  STATUTS_TICKETS,
  ETATS_EQUIPEMENTS,
  formatCodeEquipement,
} from "@/lib/constants";
import { Ticket } from "@/types";

export interface DashboardEquipementItem {
  id: string;
  code: number;
  type: string;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
  etat: string;
  affectation: string;
}

export type RecentTicket = Pick<
  Ticket,
  | "id"
  | "numero"
  | "description"
  | "priorite"
  | "statut"
  | "created_at"
  | "demandeur_nom"
  | "service_nom"
>;

interface DashboardTabsSectionProps {
  recentTickets: RecentTicket[];
  equipements: DashboardEquipementItem[];
}

export function DashboardTabsSection({
  recentTickets,
  equipements,
}: DashboardTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<"vue_generale" | "parc_materiel" | "assistance_it">("vue_generale");

  const visibleTickets = recentTickets.slice(0, 4);
  const visibleEquipements = equipements.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Boutons d'onglets locaux (Vue générale, Parc matériel, Assistance IT) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("vue_generale")}
          className={`px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            activeTab === "vue_generale"
              ? "font-bold bg-white text-slate-900 shadow-2xs"
              : "font-medium text-slate-600 hover:text-slate-900"
          }`}
        >
          Vue générale
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("parc_materiel")}
          className={`px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            activeTab === "parc_materiel"
              ? "font-bold bg-white text-slate-900 shadow-2xs"
              : "font-medium text-slate-600 hover:text-slate-900"
          }`}
        >
          Parc matériel
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("assistance_it")}
          className={`px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            activeTab === "assistance_it"
              ? "font-bold bg-white text-slate-900 shadow-2xs"
              : "font-medium text-slate-600 hover:text-slate-900"
          }`}
        >
          Assistance IT
        </button>
      </div>

      {/* ZONE CONCERNÉE : Uniquement cette carte est mise à jour selon l'onglet actif */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* CAS 1 : VUE GÉNÉRALE (Tableau des demandes récentes avec 'Voir tout ↗') */}
        {activeTab === "vue_generale" && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Demandes d'assistance récentes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derniers signalements d'incidents
                </p>
              </div>

              <Link
                href="/dashboard/tickets"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                <span>Voir tout</span>
                <span className="text-slate-400">↗</span>
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {visibleTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Aucun ticket enregistré.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 px-4">Demandeur</th>
                      <th className="pb-3 px-4">Statut</th>
                      <th className="pb-3 pl-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {visibleTickets.map((tck) => {
                      const status = STATUTS_TICKETS[tck.statut];
                      return (
                        <tr key={tck.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block font-mono">
                              #{formatNumeroTicket(tck.numero)}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatDateFr(tck.created_at)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {tck.demandeur_nom || "Demandeur"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {tck.service_nom || "Touba Gaz"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                                status?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {status?.label || tck.statut}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 max-w-[180px]">
                            <p className="line-clamp-2 text-slate-600 font-medium leading-relaxed">
                              {tck.description}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CAS 2 : PARC MATÉRIEL (Équipements récents avec état, numéro de série et affectation) */}
        {activeTab === "parc_materiel" && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Laptop className="size-4 text-emerald-600" />
                  Parc matériel informatique
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aperçu des derniers équipements répertoriés
                </p>
              </div>

              <Link
                href="/dashboard/equipements"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                <span>Voir tout</span>
                <span className="text-slate-400">↗</span>
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {visibleEquipements.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Aucun équipement enregistré.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-3 pr-4">Code</th>
                      <th className="pb-3 px-4">Équipement</th>
                      <th className="pb-3 px-4">État</th>
                      <th className="pb-3 pl-4">Affectation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {visibleEquipements.map((eq) => {
                      const etatConf = ETATS_EQUIPEMENTS[eq.etat as keyof typeof ETATS_EQUIPEMENTS];
                      return (
                        <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block font-mono">
                              #{formatCodeEquipement(eq.code)}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {eq.numero_serie || "S/N non renseigné"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {eq.marque} {eq.modele}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {eq.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                                etatConf?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {etatConf?.label || eq.etat}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 whitespace-nowrap">
                            <span className="text-slate-700 font-medium">
                              {eq.affectation}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CAS 3 : ASSISTANCE IT (Focus sur le suivi et la résolution des tickets d'assistance) */}
        {activeTab === "assistance_it" && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <LifeBuoy className="size-4 text-emerald-600" />
                  Assistance IT & Résolutions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestion des tickets, pannes matérielles et urgences IT
                </p>
              </div>

              <Link
                href="/dashboard/tickets"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                <span>Accéder au support</span>
                <span className="text-slate-400">↗</span>
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              {visibleTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Aucun incident déclaré.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-3 pr-4">Ticket</th>
                      <th className="pb-3 px-4">Demandeur</th>
                      <th className="pb-3 px-4">Statut</th>
                      <th className="pb-3 pl-4">Incident signalé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {visibleTickets.map((tck) => {
                      const status = STATUTS_TICKETS[tck.statut];
                      return (
                        <tr key={tck.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block font-mono">
                              #{formatNumeroTicket(tck.numero)}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatDateFr(tck.created_at)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {tck.demandeur_nom || "Collaborateur"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {tck.service_nom || "Touba Gaz"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                                status?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {status?.label || tck.statut}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 max-w-[200px]">
                            <p className="line-clamp-2 text-slate-600 font-medium leading-relaxed">
                              {tck.description}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
