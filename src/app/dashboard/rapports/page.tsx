"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  FileText,
  Building2,
  Wrench,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  STATUTS_TICKETS,
  PRIORITES_TICKETS,
  formatNumeroTicket,
  formatCodeEquipement,
  formatDateFr,
} from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface RapportData {
  filtres: {
    date_debut: string | null;
    date_fin: string | null;
    service_id: string;
    statut: string;
  };
  synthese: {
    totalIncidents: number;
    totalInterventions: number;
    statutsCount: Record<string, number>;
    prioritesCount: Record<string, number>;
    dureeTotaleMinutes: number;
    tauxResolution: number;
  };
  interventions: any[];
  tickets: any[];
}

export default function RapportsPage() {
  const [data, setData] = useState<RapportData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filtres
  const [typeVue, setTypeVue] = useState<"complet" | "interventions" | "incidents">("complet");
  const [periodePreset, setPeriodePreset] = useState<string>("mois");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("tous");
  const [selectedStatut, setSelectedStatut] = useState<string>("tous");
  const [editionDate, setEditionDate] = useState<string>("");

  useEffect(() => {
    setEditionDate(
      new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  // Déterminer les dates par défaut selon le preset
  useEffect(() => {
    const now = new Date();
    if (periodePreset === "mois") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "mois_dernier") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "annee") {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "tous") {
      setDateDebut("");
      setDateFin("");
    }
  }, [periodePreset]);

  // Charger les services
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setServices(json.data);
      })
      .catch((err) => console.error("Erreur services:", err));
  }, []);

  // Charger les données de rapport
  const fetchRapport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("date_debut", dateDebut);
      if (dateFin) params.append("date_fin", dateFin);
      if (selectedService && selectedService !== "tous") params.append("service_id", selectedService);
      if (selectedStatut && selectedStatut !== "tous") params.append("statut", selectedStatut);

      const res = await fetch(`/api/rapports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error("Erreur lors de la récupération du rapport.");
      }
    } catch {
      toast.error("Impossible de charger le rapport.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRapport();
  }, [dateDebut, dateFin, selectedService, selectedStatut]);

  const handlePrint = () => {
    window.print();
  };

  const formatDuree = (minutes: number) => {
    if (!minutes || minutes <= 0) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Barre d'action et filtres (Cachée à l'impression) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-400" />
              Rapports d'activité IT
            </h1>
            <p className="text-sm text-slate-400">
              Génération des bilans périodiques d'incidents et des interventions de maintenance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRapport}
              disabled={isLoading}
              className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-green-400" : ""}`} />
              Actualiser
            </Button>

            <Button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-600/20"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer / Exporter PDF
            </Button>
          </div>
        </div>

        {/* Panneau des filtres */}
        <Card className="border-slate-800 bg-[#0f172a]/70 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Type de rapport */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">
                  Vue du rapport
                </label>
                <select
                  value={typeVue}
                  onChange={(e) => setTypeVue(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
                >
                  <option value="complet">Rapport Complet (Synthèse + Tout)</option>
                  <option value="interventions">Interventions techniques seules</option>
                  <option value="incidents">Demandes d'assistance seules</option>
                </select>
              </div>

              {/* Période prédéfinie */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">
                  Période
                </label>
                <select
                  value={periodePreset}
                  onChange={(e) => setPeriodePreset(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
                >
                  <option value="mois">Mois en cours</option>
                  <option value="mois_dernier">Mois précédent</option>
                  <option value="annee">Année en cours</option>
                  <option value="personnalise">Dates personnalisées</option>
                  <option value="tous">Tout l'historique</option>
                </select>
              </div>

              {/* Dates début et fin */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">Du</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => {
                      setPeriodePreset("personnalise");
                      setDateDebut(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-200 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">Au</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setPeriodePreset("personnalise");
                      setDateFin(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-200 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">
                  Département / Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
                >
                  <option value="tous">Tous les services</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 mb-1.5 block">
                  Statut incident
                </label>
                <select
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-green-500 focus:outline-none"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="en_attente">En attente</option>
                  <option value="resolu">Résolu</option>
                  <option value="cloture">Clôturé</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          CONTENU DU RAPPORT — OPTIMISÉ POUR AFFICHAGE ET IMPRESSION
         ========================================================================= */}
      <div className="bg-[#0b1220] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Entête officiel Touba Gaz (Très élégant à l'impression) */}
        <div className="border-b border-slate-800 pb-6 mb-6 print:border-black print:pb-4 print:mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500 ring-1 ring-green-500/30 print:border print:border-black print:text-black">
                <Flame className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-wider text-white print:text-black">
                    TOUBA GAZ S.A.
                  </h2>
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400 print:border print:border-black print:text-black">
                    DIRECTION DES SYSTÈMES D'INFORMATION
                  </span>
                </div>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  Service Support & Gestion du Parc Informatique — Dakar, Sénégal
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 print:text-gray-700">
              <p className="font-semibold text-slate-200 print:text-black">
                RAPPORT OFFICIEL D'ACTIVITÉ IT
              </p>
              <p className="mt-1">
                Période :{" "}
                <span className="font-medium text-slate-300 print:text-black">
                  {dateDebut ? formatDateFr(dateDebut) : "Origine"} au {dateFin ? formatDateFr(dateFin) : "Ce jour"}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
                Édité le {editionDate || "..."}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            <p className="text-sm">Génération des données du rapport en cours...</p>
          </div>
        ) : !data ? (
          <p className="text-center py-10 text-slate-400">Aucune donnée disponible pour cette période.</p>
        ) : (
          <div className="space-y-8 print:space-y-6">
            {/* 1. SYNTHÈSE CHIFFRÉE */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 print:text-black mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400 print:text-black" />
                1. Indicateurs clés de performance (KPI)
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs text-slate-400 print:text-gray-600">Total Demandes / Incidents</p>
                  <p className="text-2xl font-bold text-white print:text-black mt-1">
                    {data.synthese.totalIncidents}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {data.synthese.statutsCount.nouveau} nouveaux, {data.synthese.statutsCount.en_cours} en cours
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs text-slate-400 print:text-gray-600">Interventions Réalisées</p>
                  <p className="text-2xl font-bold text-sky-400 print:text-black mt-1">
                    {data.synthese.totalInterventions}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    Actions techniques enregistrées
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs text-slate-400 print:text-gray-600">Taux de Résolution</p>
                  <p className="text-2xl font-bold text-emerald-400 print:text-black mt-1">
                    {data.synthese.tauxResolution} %
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {data.synthese.statutsCount.resolu + data.synthese.statutsCount.cloture} incidents résolus / clôturés
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs text-slate-400 print:text-gray-600">Temps d'Intervention Cumulé</p>
                  <p className="text-2xl font-bold text-purple-400 print:text-black mt-1">
                    {formatDuree(data.synthese.dureeTotaleMinutes)}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    Traçabilité durée active
                  </p>
                </div>
              </div>
            </div>

            {/* 2. RAPPORT DES INTERVENTIONS TECHNIQUES */}
            {(typeVue === "complet" || typeVue === "interventions") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-400 print:text-black" />
                    2. Rapport des Interventions Techniques de Maintenance ({data.interventions.length})
                  </h3>
                </div>

                {data.interventions.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-3">Aucune intervention enregistrée sur la période sélectionnée.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 print:bg-gray-100 print:text-black print:border-gray-300">
                          <th className="p-2.5 font-semibold">Date & Heure</th>
                          <th className="p-2.5 font-semibold">Ticket Réf.</th>
                          <th className="p-2.5 font-semibold">Demandeur / Service</th>
                          <th className="p-2.5 font-semibold">Matériel Concerné</th>
                          <th className="p-2.5 font-semibold">Technicien</th>
                          <th className="p-2.5 font-semibold">Actions Réalisées</th>
                          <th className="p-2.5 font-semibold">Résultat & Durée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                        {data.interventions.map((intItem) => (
                          <tr key={intItem.intervention_id} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                            <td className="p-2.5 whitespace-nowrap text-slate-300 print:text-black">
                              <div>{formatDateFr(intItem.debut)}</div>
                              <div className="text-[10px] text-slate-500 print:text-gray-500">
                                {intItem.debut ? new Date(intItem.debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </div>
                            </td>
                            <td className="p-2.5 whitespace-nowrap font-mono font-medium text-green-400 print:text-black">
                              {formatNumeroTicket(intItem.ticket_numero)}
                            </td>
                            <td className="p-2.5 text-slate-300 print:text-black">
                              <div className="font-medium">{intItem.demandeur_nom || "Non renseigné"}</div>
                              <div className="text-[10px] text-slate-500 print:text-gray-500">{intItem.service_nom || "—"}</div>
                            </td>
                            <td className="p-2.5 text-slate-300 print:text-black">
                              <div>{intItem.equipement_label || "Sans équipement spécifique"}</div>
                              {intItem.equipement_num_serie && (
                                <div className="text-[10px] font-mono text-slate-500 print:text-gray-500">
                                  S/N: {intItem.equipement_num_serie}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 whitespace-nowrap text-slate-300 print:text-black">
                              {intItem.technicien_nom || "Administrateur IT"}
                            </td>
                            <td className="p-2.5 text-slate-200 print:text-black max-w-xs">
                              <p className="line-clamp-2 print:line-clamp-none">{intItem.actions}</p>
                            </td>
                            <td className="p-2.5 whitespace-nowrap text-slate-300 print:text-black">
                              <span className="font-medium text-emerald-400 print:text-black">
                                {intItem.resultat || "Exécuté"}
                              </span>
                              <div className="text-[10px] text-slate-400 print:text-gray-500">
                                Durée : {formatDuree(intItem.duree_minutes)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. RAPPORT DE SUIVI DES INCIDENTS */}
            {(typeVue === "complet" || typeVue === "incidents") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-400 print:text-black" />
                    3. Rapport de Suivi des Incidents & Demandes d'Assistance ({data.tickets.length})
                  </h3>
                </div>

                {data.tickets.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-3">Aucun incident enregistré sur la période sélectionnée.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 print:bg-gray-100 print:text-black print:border-gray-300">
                          <th className="p-2.5 font-semibold">N° Ticket</th>
                          <th className="p-2.5 font-semibold">Date Déclaration</th>
                          <th className="p-2.5 font-semibold">Demandeur & Service</th>
                          <th className="p-2.5 font-semibold">Catégorie & Description</th>
                          <th className="p-2.5 font-semibold">Priorité</th>
                          <th className="p-2.5 font-semibold">Équipement</th>
                          <th className="p-2.5 font-semibold">Statut</th>
                          <th className="p-2.5 font-semibold">Résolution / Clôture</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                        {data.tickets.map((t) => {
                          const statutConf = STATUTS_TICKETS[t.statut as keyof typeof STATUTS_TICKETS] || {
                            label: t.statut,
                            badgeClass: "",
                          };
                          const prioriteConf = PRIORITES_TICKETS[t.priorite as keyof typeof PRIORITES_TICKETS] || {
                            label: t.priorite,
                            badgeClass: "",
                          };

                          return (
                            <tr key={t.id} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                              <td className="p-2.5 whitespace-nowrap font-mono font-medium text-green-400 print:text-black">
                                {formatNumeroTicket(t.numero)}
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-slate-300 print:text-black">
                                {formatDateFr(t.created_at)}
                              </td>
                              <td className="p-2.5 text-slate-300 print:text-black">
                                <div className="font-medium">{t.demandeur_nom || "—"}</div>
                                <div className="text-[10px] text-slate-500 print:text-gray-500">{t.service_nom || "—"}</div>
                              </td>
                              <td className="p-2.5 text-slate-200 print:text-black max-w-xs">
                                <div className="font-semibold text-slate-300 print:text-black text-[11px]">{t.categorie}</div>
                                <p className="line-clamp-2 print:line-clamp-none text-slate-400 print:text-gray-800 text-[11px]">
                                  {t.description}
                                </p>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium border print:border-black print:text-black">
                                  {prioriteConf.label}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-300 print:text-black">
                                <div>{t.equipement_label || "Général / Non lié"}</div>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold border print:border-black print:text-black">
                                  {statutConf.label}
                                </span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-[11px] text-slate-400 print:text-black">
                                {t.date_cloture ? (
                                  <div>Clôturé : {formatDateFr(t.date_cloture)}</div>
                                ) : t.date_resolution ? (
                                  <div>Résolu : {formatDateFr(t.date_resolution)}</div>
                                ) : (
                                  <span className="text-slate-600 print:text-gray-400">En cours de traitement</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Bloc de signature officiel Touba Gaz (Très important pour validation hiérarchique) */}
            <div className="pt-8 border-t border-slate-800 print:border-black mt-8 text-xs text-slate-400 print:text-black">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-300 print:text-black">
                    Le Responsable Support Informatique
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-600 mt-0.5">Visa & Signature</p>
                  <div className="h-16 mt-3 border-b border-dashed border-slate-700 print:border-gray-400" />
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wider text-slate-300 print:text-black">
                    La Direction Générale Touba Gaz
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-600 mt-0.5">Pour approbation</p>
                  <div className="h-16 mt-3 border-b border-dashed border-slate-700 print:border-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
