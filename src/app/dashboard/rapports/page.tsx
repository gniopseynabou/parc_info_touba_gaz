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
import { PageHeader } from "@/components/ui/page-header";
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
    const pad = (n: number) => String(n).padStart(2, "0");

    if (periodePreset === "mois") {
      const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const lastDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "mois_dernier") {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstDay = `${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-01`;
      const lastDay = `${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-${pad(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate())}`;
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "annee") {
      setDateDebut(`${now.getFullYear()}-01-01`);
      setDateFin(`${now.getFullYear()}-12-31`);
    } else if (periodePreset === "tous") {
      setDateDebut("");
      setDateFin("");
    }
  }, [periodePreset]);

  // Charger les services disponibles pour le filtre
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setServices(res.data);
      })
      .catch(() => {});
  }, []);

  // Récupérer les données du rapport
  const fetchRapport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("date_debut", dateDebut);
      if (dateFin) params.append("date_fin", dateFin);
      if (selectedService !== "tous") params.append("service_id", selectedService);
      if (selectedStatut !== "tous") params.append("statut", selectedStatut);

      const res = await fetch(`/api/rapports?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        toast.error("Impossible de générer le rapport.");
      }
    } catch {
      toast.error("Erreur serveur lors de la récupération des rapports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRapport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebut, dateFin, selectedService, selectedStatut]);

  const handlePrint = () => {
    window.print();
  };

  const formatDuree = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    return `${h} h ${m} min`;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Barre d'action et filtres (Cachée à l'impression) */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Rapports d'activité IT"
          description="Génération des bilans périodiques d'incidents et des interventions de maintenance."
          icon={FileText}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRapport}
            disabled={isLoading}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            Actualiser
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer / Exporter PDF
          </Button>
        </PageHeader>

        {/* Panneau des filtres */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* Type de rapport */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Vue du rapport
                </label>
                <select
                  value={typeVue}
                  onChange={(e) => setTypeVue(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
                >
                  <option value="complet">Rapport Complet (Synthèse + Tout)</option>
                  <option value="interventions">Interventions techniques seules</option>
                  <option value="incidents">Demandes d'assistance seules</option>
                </select>
              </div>

              {/* Période prédéfinie */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Période
                </label>
                <select
                  value={periodePreset}
                  onChange={(e) => setPeriodePreset(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Du</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => {
                      setPeriodePreset("personnalise");
                      setDateDebut(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Au</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setPeriodePreset("personnalise");
                      setDateFin(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Département / Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Statut incident
                </label>
                <select
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none shadow-xs"
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

      {/* CONTENU DU RAPPORT — OPTIMISÉ POUR AFFICHAGE ET IMPRESSION */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Entête officiel Touba Gaz */}
        <div className="border-b border-slate-200 pb-6 mb-6 print:border-black print:pb-4 print:mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 print:border print:border-black print:text-black">
                <Flame className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-wider text-slate-900 print:text-black">
                    TOUBA GAZ S.A.
                  </h2>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 print:border print:border-black print:text-black">
                    DIRECTION DES SYSTÈMES D'INFORMATION
                  </span>
                </div>
                <p className="text-xs text-slate-500 print:text-gray-600 mt-1">
                  Service Support & Gestion du Parc Informatique — Dakar, Sénégal
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 print:text-gray-700">
              <p className="font-bold text-slate-800 print:text-black">
                RAPPORT OFFICIEL D'ACTIVITÉ IT
              </p>
              <p className="mt-1">
                Période :{" "}
                <span className="font-medium text-slate-900 print:text-black">
                  {dateDebut ? formatDateFr(dateDebut) : "Origine"} au {dateFin ? formatDateFr(dateFin) : "Ce jour"}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 print:text-gray-500 mt-0.5">
                Édité le {editionDate || "..."}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm">Génération des données du rapport en cours...</p>
          </div>
        ) : !data ? (
          <p className="text-center py-10 text-slate-500">Aucune donnée disponible pour cette période.</p>
        ) : (
          <div className="space-y-8 print:space-y-6">
            {/* 1. SYNTHÈSE CHIFFRÉE */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 print:text-black" />
                1. Indicateurs clés de performance (KPI)
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">Total Demandes / Incidents</p>
                  <p className="text-2xl font-bold text-slate-900 print:text-black mt-1">
                    {data.synthese.totalIncidents}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {data.synthese.statutsCount.nouveau} nouveaux, {data.synthese.statutsCount.en_cours} en cours
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">Interventions Réalisées</p>
                  <p className="text-2xl font-bold text-sky-700 print:text-black mt-1">
                    {data.synthese.totalInterventions}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    Actions techniques enregistrées
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">Taux de Résolution</p>
                  <p className="text-2xl font-bold text-emerald-700 print:text-black mt-1">
                    {data.synthese.tauxResolution} %
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {data.synthese.statutsCount.resolu + data.synthese.statutsCount.cloture} incidents résolus / clôturés
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">Temps d'Intervention Cumulé</p>
                  <p className="text-2xl font-bold text-purple-700 print:text-black mt-1">
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-emerald-600 print:text-black" />
                    2. Rapport des Interventions Techniques de Maintenance ({data.interventions.length})
                  </h3>
                </div>

                {data.interventions.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-3">Aucune intervention enregistrée sur la période sélectionnée.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 print:border-gray-300">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold print:bg-gray-100 print:text-black print:border-gray-300">
                          <th className="p-2.5 font-semibold">Date & Heure</th>
                          <th className="p-2.5 font-semibold">Ticket Réf.</th>
                          <th className="p-2.5 font-semibold">Demandeur / Service</th>
                          <th className="p-2.5 font-semibold">Matériel Concerné</th>
                          <th className="p-2.5 font-semibold">Technicien</th>
                          <th className="p-2.5 font-semibold">Actions Réalisées</th>
                          <th className="p-2.5 font-semibold">Résultat & Durée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-gray-200 text-slate-700">
                        {data.interventions.map((intItem) => (
                          <tr key={intItem.intervention_id} className="hover:bg-slate-50/70 print:hover:bg-transparent">
                            <td className="p-2.5 whitespace-nowrap text-slate-800 print:text-black">
                              <div className="font-medium">{formatDateFr(intItem.debut)}</div>
                              <div className="text-[10px] text-slate-500 print:text-gray-500">
                                {intItem.debut ? new Date(intItem.debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </div>
                            </td>
                            <td className="p-2.5 whitespace-nowrap font-mono font-bold text-emerald-700 print:text-black">
                              {formatNumeroTicket(intItem.ticket_numero)}
                            </td>
                            <td className="p-2.5 text-slate-800 print:text-black">
                              <div className="font-semibold">{intItem.demandeur_nom || "Non renseigné"}</div>
                              <div className="text-[10px] text-slate-500 print:text-gray-500">{intItem.service_nom || "—"}</div>
                            </td>
                            <td className="p-2.5 text-slate-800 print:text-black">
                              <div className="font-medium">{intItem.equipement_label || "Sans équipement spécifique"}</div>
                              {intItem.equipement_num_serie && (
                                <div className="text-[10px] font-mono text-slate-500 print:text-gray-500">
                                  S/N: {intItem.equipement_num_serie}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 whitespace-nowrap text-slate-700 print:text-black">
                              {intItem.technicien_nom || "Administrateur IT"}
                            </td>
                            <td className="p-2.5 text-slate-800 print:text-black max-w-xs">
                              <p className="line-clamp-2 print:line-clamp-none font-medium">{intItem.actions}</p>
                            </td>
                            <td className="p-2.5 whitespace-nowrap text-slate-800 print:text-black">
                              <span className="font-semibold text-emerald-700 print:text-black">
                                {intItem.resultat || "Exécuté"}
                              </span>
                              <div className="text-[10px] text-slate-500 print:text-gray-500">
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 print:text-black" />
                    3. Rapport de Suivi des Incidents & Demandes d'Assistance ({data.tickets.length})
                  </h3>
                </div>

                {data.tickets.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-3">Aucun incident enregistré sur la période sélectionnée.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 print:border-gray-300">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold print:bg-gray-100 print:text-black print:border-gray-300">
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
                      <tbody className="divide-y divide-slate-100 print:divide-gray-200 text-slate-700">
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
                            <tr key={t.id} className="hover:bg-slate-50/70 print:hover:bg-transparent">
                              <td className="p-2.5 whitespace-nowrap font-mono font-bold text-emerald-700 print:text-black">
                                {formatNumeroTicket(t.numero)}
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-slate-700 print:text-black">
                                {formatDateFr(t.created_at)}
                              </td>
                              <td className="p-2.5 text-slate-800 print:text-black">
                                <div className="font-semibold">{t.demandeur_nom || "—"}</div>
                                <div className="text-[10px] text-slate-500 print:text-gray-500">{t.service_nom || "—"}</div>
                              </td>
                              <td className="p-2.5 text-slate-800 print:text-black max-w-xs">
                                <div className="font-semibold text-slate-900 print:text-black text-[11px]">{t.categorie}</div>
                                <p className="line-clamp-2 print:line-clamp-none text-slate-600 print:text-gray-800 text-[11px]">
                                  {t.description}
                                </p>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${prioriteConf.badgeClass} print:border-black print:text-black`}
                                  title={t.priorite_explication || `Priorité ${prioriteConf.label}`}
                                >
                                  {prioriteConf.label}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-700 print:text-black">
                                <div>{t.equipement_label || "Général / Non lié"}</div>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statutConf.badgeClass} print:border-black print:text-black`}>
                                  {statutConf.label}
                                </span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap text-[11px] text-slate-600 print:text-black">
                                {t.date_cloture ? (
                                  <div className="font-medium text-slate-800">Clôturé : {formatDateFr(t.date_cloture)}</div>
                                ) : t.date_resolution ? (
                                  <div className="font-medium text-emerald-700">Résolu : {formatDateFr(t.date_resolution)}</div>
                                ) : (
                                  <span className="text-slate-400 print:text-gray-400 italic">En cours</span>
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

            {/* Bloc de signature officiel Touba Gaz */}
            <div className="pt-8 border-t border-slate-200 print:border-black mt-8 text-xs text-slate-600 print:text-black">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-800 print:text-black">
                    Le Responsable Support Informatique
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-600 mt-0.5">Visa & Signature</p>
                  <div className="h-16 mt-3 border-b border-dashed border-slate-300 print:border-gray-400" />
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-800 print:text-black">
                    La Direction Générale Touba Gaz
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-600 mt-0.5">Pour approbation</p>
                  <div className="h-16 mt-3 border-b border-dashed border-slate-300 print:border-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
