"use client";

import { useEffect, useState } from "react";
import {
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
  TrendingUp,
  Download,
  FileDown,
  User,
  Laptop,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  STATUTS_TICKETS,
  PRIORITES_TICKETS,
  CATEGORIES_TICKETS,
  formatNumeroTicket,
  formatDateFr,
} from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { RapportCharts } from "@/components/rapports/charts";
import { generateProfessionalPDF } from "@/lib/export_pdf";

interface RapportData {
  filtres: {
    date_debut: string | null;
    date_fin: string | null;
    service_id: string;
    type_equipement: string;
    statut: string;
    priorite: string;
  };
  synthese: {
    totalIncidents: number;
    totalInterventions: number;
    statutsCount: Record<string, number>;
    prioritesCount: Record<string, number>;
    dureeTotaleMinutes: number;
    tauxResolution: number;
  };
  graphiques: {
    equipementsParEtat: Record<string, number>;
    equipementsParType: { type: string; count: number }[];
    ticketsEvolution: { date: string; count: number }[];
    prioritesCount: Record<string, number>;
    statutsCount: Record<string, number>;
    interventionsEvolution: { date: string; count: number; duree: number }[];
  };
  interventions: any[];
  tickets: any[];
}

export default function RapportsPage() {
  const [data, setData] = useState<RapportData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [employes, setEmployes] = useState<any[]>([]);
  const [typesEquipements, setTypesEquipements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Filtres compacts
  const [periodePreset, setPeriodePreset] = useState<string>("mois");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("tous");
  const [selectedStatut, setSelectedStatut] = useState<string>("tous");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("tous");

  // Filtres avancés (repliés par défaut)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedEmploye, setSelectedEmploye] = useState<string>("tous");
  const [selectedPriorite, setSelectedPriorite] = useState<string>("tous");
  const [selectedTypeEquipement, setSelectedTypeEquipement] = useState<string>("tous");
  const [selectedEtatEquipement, setSelectedEtatEquipement] = useState<string>("tous");

  const [activeTab, setActiveTab] = useState<"tout" | "demandes_interventions" | "graphiques">("tout");
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

  // Déterminer les dates par défaut selon le preset (Aujourd'hui, Cette semaine, Ce mois, Ce trimestre, Cette année, etc.)
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (periodePreset === "aujourdhui") {
      setDateDebut(todayStr);
      setDateFin(todayStr);
    } else if (periodePreset === "semaine") {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setDateDebut(`${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`);
      setDateFin(`${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`);
    } else if (periodePreset === "mois") {
      const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const lastDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      )}`;
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "trimestre") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startMonth = currentQuarter * 3;
      const endMonth = startMonth + 2;
      const firstDay = `${now.getFullYear()}-${pad(startMonth + 1)}-01`;
      const lastDay = `${now.getFullYear()}-${pad(endMonth + 1)}-${pad(
        new Date(now.getFullYear(), endMonth + 1, 0).getDate()
      )}`;
      setDateDebut(firstDay);
      setDateFin(lastDay);
    } else if (periodePreset === "annee") {
      setDateDebut(`${now.getFullYear()}-01-01`);
      setDateFin(`${now.getFullYear()}-12-31`);
    } else if (periodePreset === "mois_precedent") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateDebut(`${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`);
      setDateFin(`${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`);
    } else if (periodePreset === "tous") {
      setDateDebut("");
      setDateFin("");
    }
  }, [periodePreset]);

  // Charger les référentiels
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setServices(res.data);
      })
      .catch(() => {});

    fetch("/api/equipements")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const uniqueTypes = Array.from(
            new Set(res.data.map((e: any) => e.type).filter(Boolean))
          ) as string[];
          setTypesEquipements(uniqueTypes);
        }
      })
      .catch(() => {});
  }, []);

  // Charger les employés selon le service
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedService && selectedService !== "tous") {
      params.append("service_id", selectedService);
    }
    fetch(`/api/employes?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setEmployes(res.data);
        }
      })
      .catch(() => {});
  }, [selectedService]);

  // Récupérer les données du rapport
  const fetchRapport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append("date_debut", dateDebut);
      if (dateFin) params.append("date_fin", dateFin);
      if (selectedService !== "tous") params.append("service_id", selectedService);
      if (selectedEmploye !== "tous") params.append("employe_id", selectedEmploye);
      if (selectedTypeEquipement !== "tous") params.append("type_equipement", selectedTypeEquipement);
      if (selectedEtatEquipement !== "tous") params.append("etat_equipement", selectedEtatEquipement);
      if (selectedStatut !== "tous") params.append("statut", selectedStatut);
      if (selectedPriorite !== "tous") params.append("priorite", selectedPriorite);
      if (selectedCategorie !== "tous") params.append("categorie", selectedCategorie);

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
  }, [
    dateDebut,
    dateFin,
    selectedService,
    selectedEmploye,
    selectedTypeEquipement,
    selectedEtatEquipement,
    selectedStatut,
    selectedPriorite,
    selectedCategorie,
  ]);

  const handleResetFilters = () => {
    setPeriodePreset("mois");
    setSelectedService("tous");
    setSelectedStatut("tous");
    setSelectedCategorie("tous");
    setSelectedEmploye("tous");
    setSelectedTypeEquipement("tous");
    setSelectedEtatEquipement("tous");
    setSelectedPriorite("tous");
  };

  const activeAdvancedCount = [
    selectedEmploye !== "tous",
    selectedPriorite !== "tous",
    selectedTypeEquipement !== "tous",
    selectedEtatEquipement !== "tous",
  ].filter(Boolean).length;

  const formatDuree = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    return `${h} h ${m} min`;
  };

  // Export PDF Professionnel jsPDF + jspdf-autotable
  const handleExportPDF = () => {
    if (!data) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const serviceName =
        selectedService !== "tous"
          ? services.find((s) => s.id === selectedService)?.nom
          : "Tous services";

      const pdfItems = data.tickets.map((t) => ({
        numero: t.numero,
        date: formatDateFr(t.created_at),
        demandeur: t.demandeur_nom || "Non renseigné",
        service: t.service_nom || "Touba Gaz",
        equipement: t.equipement_label || "Matériel général",
        categorie: t.categorie || "Assistance IT",
        priorite: t.priorite || "Normale",
        statut: t.statut || "Nouveau",
        description: t.description || "",
        interventionActions: t.intervention_actions || null,
        interventionResultat: t.intervention_resultat || null,
        dureeMinutes: t.duree_minutes || 0,
      }));

      generateProfessionalPDF({
        periode: {
          debut: dateDebut ? formatDateFr(dateDebut) : "",
          fin: dateFin ? formatDateFr(dateFin) : "",
          filtresTexte: [
            serviceName,
            selectedCategorie !== "tous" ? `Catégorie: ${selectedCategorie}` : "",
            selectedTypeEquipement !== "tous" ? selectedTypeEquipement : "",
            selectedStatut !== "tous" ? `Statut: ${selectedStatut}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        },
        editionDate,
        synthese: data.synthese,
        graphiques: data.graphiques,
        demandesEtInterventions: pdfItems,
      });

      toast.success("Rapport PDF officiel téléchargé avec succès.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Word (.doc)
  const handleExportWord = () => {
    if (!data) {
      toast.error("Aucune donnée à exporter.");
      return;
    }

    const title = `Rapport_Activite_Touba_Gaz_${dateDebut || "debut"}_${dateFin || "fin"}`;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Rapport d'activité IT — Touba Gaz SA</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #17231B; margin: 20px; }
          h1 { color: #16A34A; font-size: 18pt; margin-bottom: 2px; }
          h2 { color: #15803D; font-size: 14pt; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 18px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th { background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 6px; text-align: left; font-weight: bold; }
          td { border: 1px solid #E2E8F0; padding: 6px; }
          .kpi-box { background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 10px; margin-bottom: 10px; border-radius: 6px; }
          .footer { font-size: 9pt; color: #64748B; margin-top: 25px; border-top: 1px solid #E2E8F0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>TOUBA GAZ S.A. — DIRECTION DES SYSTÈMES D'INFORMATION</h1>
        <p><strong>RAPPORT D'ACTIVITÉ IT & GESTION DU PARC</strong></p>
        <p>Période : Du ${dateDebut ? formatDateFr(dateDebut) : "Origine"} au ${dateFin ? formatDateFr(dateFin) : "Ce jour"} | Édité le : ${editionDate}</p>
        <hr/>

        <h2>1. Indicateurs clés de performance (KPI)</h2>
        <div class="kpi-box">
          <p><strong>Total Incidents / Demandes :</strong> ${data.synthese.totalIncidents}</p>
          <p><strong>Interventions techniques réalisées :</strong> ${data.synthese.totalInterventions}</p>
          <p><strong>Taux de résolution global :</strong> ${data.synthese.tauxResolution} %</p>
          <p><strong>Durée d'intervention cumulée :</strong> ${formatDuree(data.synthese.dureeTotaleMinutes)}</p>
        </div>

        <h2>2. Demandes d'Assistance et Interventions de Maintenance (${data.tickets.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>Date</th>
              <th>Demandeur / Service</th>
              <th>Équipement</th>
              <th>Statut / Priorité</th>
              <th>Description de la demande</th>
              <th>Intervention Réalisée</th>
              <th>Résultat & Technicien</th>
            </tr>
          </thead>
          <tbody>
            ${data.tickets
              .map(
                (t) => `
              <tr>
                <td>#${t.numero}</td>
                <td>${formatDateFr(t.created_at)}</td>
                <td>${t.demandeur_nom || "—"} (${t.service_nom || "—"})</td>
                <td>${t.equipement_label || "Matériel général"}</td>
                <td>${t.statut} / ${t.priorite}</td>
                <td>${t.description}</td>
                <td>${t.intervention_actions || "Aucune intervention"}</td>
                <td>${t.intervention_resultat || "En attente"} ${t.technicien_nom ? `par ${t.technicien_nom}` : ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>© Copyright 2026 Touba Gaz SA — Direction des Systèmes d'Information — Document confidentiel.</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Rapport Word généré avec succès.");
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Barre d'en-tête et actions d'export */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Rapports d'activité IT"
          description="Bilan périodique unifié des demandes, interventions de maintenance et indicateurs du parc."
          icon={FileText}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleExportWord}
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs cursor-pointer gap-2"
            >
              <FileDown className="size-4 text-emerald-600" />
              Exporter Word (.doc)
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs cursor-pointer gap-2"
            >
              {isExportingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Exporter PDF
            </Button>

          </div>
        </PageHeader>

        {/* Panneau de filtres compact & épuré (Items 7, 8 & 11) */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Filter className="size-3.5 text-emerald-600" />
                <span>Filtres du rapport</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-slate-500 hover:text-slate-800 gap-1.5 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                Réinitialiser
              </Button>
            </div>

            {/* 8. Bloc principal compact : 4 filtres essentiels [ Période ] [ Service ] [ Statut ] [ Catégorie ] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filtre 1 — Période */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Période
                </label>
                <select
                  value={periodePreset}
                  onChange={(e) => setPeriodePreset(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-2xs"
                >
                  <option value="mois">Ce mois</option>
                  <option value="aujourdhui">Aujourd'hui</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="trimestre">Ce trimestre</option>
                  <option value="annee">Cette année</option>
                  <option value="tous">Tout l'historique</option>
                  <option value="personnalise">Période personnalisée...</option>
                </select>
              </div>

              {/* Filtre 2 — Service */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setSelectedEmploye("tous");
                  }}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-2xs"
                >
                  <option value="tous">Tous les services</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre 3 — Statut */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Statut
                </label>
                <select
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-2xs"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="en_attente">En attente</option>
                  <option value="resolu">Résolu</option>
                  <option value="cloture">Clôturé</option>
                </select>
              </div>

              {/* Filtre 4 — Catégorie */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Catégorie
                </label>
                <select
                  value={selectedCategorie}
                  onChange={(e) => setSelectedCategorie(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none shadow-2xs"
                >
                  <option value="tous">Toutes les catégories</option>
                  {CATEGORIES_TICKETS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plage de dates personnalisée : s'ouvre UNIQUEMENT si sélectionnée */}
            {periodePreset === "personnalise" && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Dates personnalisées :
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                  />
                  <span className="text-slate-400 text-xs font-medium">→</span>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Bouton pour déplier les Filtres avancés (fermés par défaut) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
              >
                <span>Filtres avancés</span>
                {showAdvancedFilters ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                {activeAdvancedCount > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    {activeAdvancedCount} actif{activeAdvancedCount > 1 ? "s" : ""}
                  </span>
                )}
              </button>

              {/* Filtres avancés (Repliés par défaut) */}
              {showAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Employé / Demandeur */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Employé / Demandeur
                    </label>
                    <select
                      value={selectedEmploye}
                      onChange={(e) => setSelectedEmploye(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                    >
                      <option value="tous">Tous les employés</option>
                      {employes.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.prenom} {emp.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priorité */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Priorité
                    </label>
                    <select
                      value={selectedPriorite}
                      onChange={(e) => setSelectedPriorite(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                    >
                      <option value="tous">Toutes les priorités</option>
                      <option value="basse">Basse</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>

                  {/* Type matériel */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Type de matériel
                    </label>
                    <select
                      value={selectedTypeEquipement}
                      onChange={(e) => setSelectedTypeEquipement(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                    >
                      <option value="tous">Tous les types</option>
                      {typesEquipements.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* État matériel */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      État du matériel
                    </label>
                    <select
                      value={selectedEtatEquipement}
                      onChange={(e) => setSelectedEtatEquipement(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-600 outline-none"
                    >
                      <option value="tous">Tous les états</option>
                      <option value="en_service">En service</option>
                      <option value="en_panne">En panne</option>
                      <option value="en_maintenance">En maintenance</option>
                      <option value="hors_service">Hors service</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VUE PRINCIPALE DU RAPPORT */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Entête officiel Touba Gaz */}
        <div className="border-b border-slate-200 pb-6 mb-6 print:border-black print:pb-4 print:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 print:border print:border-black print:text-black shadow-2xs">
                <Flame className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-wider text-slate-900 print:text-black">
                    TOUBA GAZ S.A.
                  </h2>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 print:border print:border-black print:text-black">
                    DIRECTION DES SYSTÈMES D'INFORMATION
                  </span>
                </div>
                <p className="text-xs text-slate-500 print:text-gray-600 mt-1">
                  Service Support IT & Gestion du Parc Informatique — Dakar, Sénégal
                </p>
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-500 print:text-gray-700">
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
            <Loader2 className="size-8 animate-spin text-emerald-600" />
            <p className="text-sm">Génération des données et graphiques du rapport en cours...</p>
          </div>
        ) : !data ? (
          <p className="text-center py-10 text-slate-500">Aucune donnée disponible pour cette période.</p>
        ) : (
          <div className="space-y-8 print:space-y-6">
            {/* 1. SYNTHÈSE CHIFFRÉE (4 INDICATEURS CLÉS MAX) */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black mb-3 flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600 print:text-black" />
                1. Indicateurs clés de performance (KPI)
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">
                    Total Signalements
                  </p>
                  <p className="text-2xl font-bold text-slate-900 print:text-black mt-1">
                    {data.synthese.totalIncidents}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {data.synthese.statutsCount.nouveau || 0} nouveaux, {data.synthese.statutsCount.en_cours || 0} en cours
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">
                    Interventions IT
                  </p>
                  <p className="text-2xl font-bold text-sky-700 print:text-black mt-1">
                    {data.synthese.totalInterventions}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    Actions techniques enregistrées
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">
                    Taux de Résolution
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 print:text-black mt-1">
                    {data.synthese.tauxResolution} %
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    {(data.synthese.statutsCount.resolu || 0) + (data.synthese.statutsCount.cloture || 0)} incidents résolus
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 print:border-gray-300 print:bg-gray-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">
                    Durée Cumulée
                  </p>
                  <p className="text-2xl font-bold text-purple-700 print:text-black mt-1">
                    {formatDuree(data.synthese.dureeTotaleMinutes)}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-gray-500 mt-1">
                    Traçabilité du temps d'assistance
                  </p>
                </div>
              </div>
            </div>

            {/* 2. GRAPHIQUES PROFESSIONNELS ENRICHIS */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black flex items-center gap-2">
                <Laptop className="size-4 text-emerald-600 print:text-black" />
                2. Analyses graphiques de l'activité & Disponibilité
              </h3>
              <RapportCharts data={data.graphiques} />
            </div>

            {/* 3. VUE UNIFIÉE : DEMANDES ET INTERVENTIONS (Req 8.2) */}
            <div className="space-y-3 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black flex items-center gap-2">
                  <Wrench className="size-4 text-emerald-600 print:text-black" />
                  3. Demandes d'assistance et interventions ({data.tickets.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium print:hidden">
                  Vue consolidée : Demande d'origine & Prise en charge technique
                </span>
              </div>

              {data.tickets.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Aucune demande ni intervention enregistrée pour les filtres sélectionnés.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-gray-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold print:bg-gray-100 print:text-black print:border-gray-300">
                        <th className="p-3 font-semibold">Réf. / Date</th>
                        <th className="p-3 font-semibold">Demandeur & Service</th>
                        <th className="p-3 font-semibold">Matériel Concerné</th>
                        <th className="p-3 font-semibold">Problème Signalé</th>
                        <th className="p-3 font-semibold">Statut / Priorité</th>
                        <th className="p-3 font-semibold min-w-[280px]">Intervention de Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-gray-200 text-slate-700">
                      {data.tickets.map((tck) => {
                        const status = STATUTS_TICKETS[tck.statut as keyof typeof STATUTS_TICKETS];
                        const priority = PRIORITES_TICKETS[tck.priorite as keyof typeof PRIORITES_TICKETS];
                        const hasIntervention = Boolean(tck.intervention_id || tck.intervention_actions);

                        return (
                          <tr key={tck.id} className="hover:bg-slate-50/70 print:hover:bg-transparent">
                            {/* Réf & Date */}
                            <td className="p-3 whitespace-nowrap align-top text-slate-800 print:text-black">
                              <span className="font-mono font-bold text-emerald-700 print:text-black block">
                                {formatNumeroTicket(tck.numero)}
                              </span>
                              <div className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
                                {formatDateFr(tck.created_at)}
                              </div>
                              <span className="inline-block mt-1 text-[10px] text-slate-400 font-medium">
                                Canal: {tck.canal || "web"}
                              </span>
                            </td>

                            {/* Demandeur & Service */}
                            <td className="p-3 align-top text-slate-800 print:text-black">
                              <div className="font-semibold">{tck.demandeur_nom || "Non renseigné"}</div>
                              <div className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
                                {tck.service_nom || "Touba Gaz"}
                              </div>
                            </td>

                            {/* Équipement */}
                            <td className="p-3 align-top text-slate-800 print:text-black">
                              <div className="font-medium text-slate-900">
                                {tck.equipement_label || "Matériel général"}
                              </div>
                              {tck.equipement_num_serie && (
                                <div className="text-[10px] font-mono text-slate-500 print:text-gray-500 mt-0.5">
                                  S/N: {tck.equipement_num_serie}
                                </div>
                              )}
                            </td>

                            {/* Catégorie & Description */}
                            <td className="p-3 align-top text-slate-800 print:text-black max-w-xs">
                              <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 print:border print:border-black print:text-black mb-1">
                                {tck.categorie || "Assistance"}
                              </span>
                              <p className="text-[11px] text-slate-700 line-clamp-3 print:line-clamp-none font-medium">
                                {tck.description}
                              </p>
                            </td>

                            {/* Statut & Priorité */}
                            <td className="p-3 align-top whitespace-nowrap">
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                    status?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                                  } print:border-black print:text-black print:bg-transparent`}
                                >
                                  {status?.label || tck.statut}
                                </span>
                                <div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                      priority?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                                    } print:border-black print:text-black print:bg-transparent`}
                                  >
                                    {priority?.label || tck.priorite}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Suivi Intervention (Req 8.2) */}
                            <td className="p-3 align-top text-slate-800 print:text-black">
                              {hasIntervention ? (
                                <div className="space-y-1.5 rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5 print:border-gray-300 print:bg-transparent">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-emerald-800 print:text-black">
                                      {tck.technicien_nom || "Technicien DSI"}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500">
                                      {formatDuree(tck.duree_minutes)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-700 line-clamp-2 print:line-clamp-none">
                                    <strong className="text-slate-900">Actions :</strong>{" "}
                                    {tck.intervention_actions}
                                  </p>
                                  {tck.intervention_resultat && (
                                    <div className="text-[10px] text-emerald-700 font-medium">
                                      Résultat : {tck.intervention_resultat}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-center text-slate-400">
                                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                    Aucune intervention
                                  </span>
                                  <p className="text-[10px] mt-1 text-slate-400 italic">
                                    En attente de prise en charge
                                  </p>
                                </div>
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
          </div>
        )}
      </div>
    </div>
  );
}