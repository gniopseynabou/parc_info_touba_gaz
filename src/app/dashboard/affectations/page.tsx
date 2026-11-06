"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Share2,
  Plus,
  User,
  Building2,
  Loader2,
  X,
  FileQuestion,
  CheckCircle2,
  CheckSquare,
  AlertCircle,
  Laptop,
  Clock,
  Archive,
  Search,
  SlidersHorizontal,
  PackageCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Affectation, Equipement, Employe, Service } from "@/types";
import { formatDateFr, formatCodeEquipement } from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AffectationsPage() {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [equipementsDispo, setEquipementsDispo] = useState<Equipement[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<"toutes" | "actives" | "cloturees">("toutes");
  const [filterTypeCible, setFilterTypeCible] = useState<"tous" | "employe" | "service">("tous");

  // Modal d'affectation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState("");
  const [cibleType, setCibleType] = useState<"employe" | "service">("employe");
  const [filterModalService, setFilterModalService] = useState<string>("tous");
  const [selectedCibleId, setSelectedCibleId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resAff, resEq, resEmp, resSrv] = await Promise.all([
        fetch("/api/affectations"),
        fetch("/api/equipements?disponible=true"),
        fetch("/api/employes"),
        fetch("/api/services"),
      ]);

      const jsonAff = await resAff.json();
      const jsonEq = await resEq.json();
      const jsonEmp = await resEmp.json();
      const jsonSrv = await resSrv.json();

      if (jsonAff.success) setAffectations(jsonAff.data || []);
      if (jsonEq.success) {
        const dispo = jsonEq.data || [];
        setEquipementsDispo(dispo);
        if (dispo.length > 0) setSelectedEqId(dispo[0].id);
        else setSelectedEqId("");
      }
      if (jsonEmp.success) {
        const empList = jsonEmp.data || [];
        setEmployes(empList);
        if (empList.length > 0 && !selectedCibleId) setSelectedCibleId(empList[0].id);
      }
      if (jsonSrv.success) setServices(jsonSrv.data || []);
    } catch {
      toast.error("Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setDateDebut(new Date().toISOString().slice(0, 10));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Employés filtrés pour la sélection liée (cascading dropdown)
  const filteredEmployesForModal = useMemo(() => {
    if (filterModalService === "tous") return employes;
    return employes.filter((e) => e.service_id === filterModalService);
  }, [employes, filterModalService]);

  // Ajuster l'employé sélectionné si le filtre de service change
  useEffect(() => {
    if (cibleType === "employe") {
      if (filteredEmployesForModal.length > 0) {
        setSelectedCibleId(filteredEmployesForModal[0].id);
      } else {
        setSelectedCibleId("");
      }
    } else if (cibleType === "service") {
      if (services.length > 0) {
        setSelectedCibleId(services[0].id);
      }
    }
  }, [filterModalService, cibleType, services, filteredEmployesForModal]);

  // Indicateurs statistiques réels calculés (Item 4.1)
  const stats = useMemo(() => {
    let actives = 0;
    let cloturees = 0;
    const equipementsAffectesSet = new Set<string>();

    for (const aff of affectations) {
      if (!aff.date_fin) {
        actives++;
        equipementsAffectesSet.add(aff.equipement_id);
      } else {
        cloturees++;
      }
    }

    return {
      totalEquipementsAffectes: equipementsAffectesSet.size,
      affectationsActives: actives,
      affectationsCloturees: cloturees,
      equipementsNonAffectes: equipementsDispo.length,
    };
  }, [affectations, equipementsDispo]);

  // Liste filtrée selon recherche et statut
  const filteredAffectations = useMemo(() => {
    return affectations.filter((aff) => {
      const isActive = !aff.date_fin;
      if (filterStatut === "actives" && !isActive) return false;
      if (filterStatut === "cloturees" && isActive) return false;

      if (filterTypeCible === "employe" && !aff.employe_id) return false;
      if (filterTypeCible === "service" && !aff.service_id) return false;

      if (search) {
        const q = search.toLowerCase();
        const eqLabel = (aff.equipement_label || "").toLowerCase();
        const eqType = (aff.equipement_type || "").toLowerCase();
        const emp = (aff.employe_nom || "").toLowerCase();
        const srv = (aff.service_nom || "").toLowerCase();
        const comm = (aff.commentaire || "").toLowerCase();
        if (!eqLabel.includes(q) && !eqType.includes(q) && !emp.includes(q) && !srv.includes(q) && !comm.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [affectations, filterStatut, filterTypeCible, search]);

  const handleCreateAffectation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) {
      toast.error("Veuillez sélectionner un équipement disponible.");
      return;
    }
    if (!selectedCibleId) {
      toast.error("Veuillez sélectionner un bénéficiaire (employé ou service).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: selectedEqId,
          cible_type: cibleType,
          cible_id: selectedCibleId,
          date_debut: dateDebut,
          commentaire,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Affectation enregistrée avec succès.");
        setIsModalOpen(false);
        setCommentaire("");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de l'enregistrement.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloturerAffectation = async (aff: Affectation) => {
    const today = new Date().toISOString().slice(0, 10);
    const dateFin = prompt(
      `Date de fin pour la restitution de cet équipement (${aff.equipement_type || "Matériel"}) :`,
      today
    );
    if (!dateFin) return;

    try {
      const res = await fetch(`/api/affectations/${aff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_fin: dateFin }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Affectation clôturée. Le matériel est réintégré en stock disponible.");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la clôture.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <PageHeader
        title="Affectations du matériel & Dotations"
        description="Traçabilité nominative et par service des équipements informatiques Touba Gaz."
        icon={Share2}
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle affectation
          </Button>
        </div>
      </PageHeader>

      {/* 4.1 Cartes d'indicateurs statistiques cliquables */}
      <section aria-label="Indicateurs clés des affectations">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Équipements actuellement affectés */}
          <button
            type="button"
            onClick={() => {
              setFilterStatut("actives");
              setFilterTypeCible("tous");
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatut === "actives"
                ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Équipements affectés</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Laptop className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
              {stats.totalEquipementsAffectes}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Matériels actuellement attribués
            </p>
          </button>

          {/* Affectations actives */}
          <button
            type="button"
            onClick={() => {
              setFilterStatut("actives");
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatut === "actives"
                ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Affectations actives</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
              {stats.affectationsActives}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              En cours d'utilisation
            </p>
          </button>

          {/* Affectations clôturées */}
          <button
            type="button"
            onClick={() => {
              setFilterStatut("cloturees");
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatut === "cloturees"
                ? "bg-white border-slate-700 ring-2 ring-slate-400/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Affectations clôturées</span>
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Archive className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-700 mt-2 tabular-nums">
              {stats.affectationsCloturees}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Historique restitué
            </p>
          </button>

          {/* Non affectés (En stock) */}
          <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Non affectés (En stock)</span>
              <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <PackageCheck className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-sky-700 mt-2 tabular-nums">
              {stats.equipementsNonAffectes}
            </p>
            <p className="text-[11px] text-sky-600 mt-1 font-medium">
              Disponibles pour dotation
            </p>
          </div>
        </div>
      </section>

      {/* Barre de recherche et de filtres unifiée */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par équipement, bénéficiaire, service, commentaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-medium">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Filtres :</span>
            </div>

            {/* Filtre par statut d'affectation */}
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as any)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 shadow-xs"
            >
              <option value="toutes">Toutes les affectations</option>
              <option value="actives">Actives uniquement</option>
              <option value="cloturees">Clôturées uniquement</option>
            </select>

            {/* Filtre type de bénéficiaire */}
            <select
              value={filterTypeCible}
              onChange={(e) => setFilterTypeCible(e.target.value as any)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 shadow-xs"
            >
              <option value="tous">Tous les bénéficiaires</option>
              <option value="employe">Employés individuels</option>
              <option value="service">Services partagés</option>
            </select>

            {(filterStatut !== "toutes" || filterTypeCible !== "tous" || search) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatut("toutes");
                  setFilterTypeCible("tous");
                  setSearch("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 h-10 px-2"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tableau des Affectations */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Bénéficiaire</th>
                <th className="py-3 px-4">Type de dotation</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Commentaire</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement des affectations...
                  </td>
                </tr>
              ) : filteredAffectations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Aucune affectation trouvée pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredAffectations.map((aff) => {
                  const isActive = !aff.date_fin;
                  return (
                    <tr key={aff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {aff.equipement_type}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {aff.equipement_label}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {aff.employe_nom ? (
                          <div>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                              <User className="h-3.5 w-3.5 text-emerald-600" />
                              {aff.employe_nom}
                            </span>
                            {aff.service_nom && (
                              <span className="text-[11px] text-slate-400 block pl-5">
                                {aff.service_nom}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            {aff.service_nom}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {aff.employe_nom ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold inline-block">
                            Personnel
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold inline-block">
                            Service (partagé)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-xs">
                          Du {formatDateFr(aff.date_debut)}
                        </div>
                        {aff.date_fin && (
                          <div className="text-xs text-slate-400">
                            Au {formatDateFr(aff.date_fin)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs text-slate-500 bg-slate-100 border border-slate-200 font-medium">
                            Clôturée
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                        {aff.commentaire || "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloturerAffectation(aff)}
                            className="h-8 border-slate-200 bg-white text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs cursor-pointer"
                            title="Clôturer cette affectation (restituer le matériel au stock)"
                          >
                            <CheckSquare className="h-3.5 w-3.5 mr-1 text-amber-600" />
                            Clôturer
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Terminée</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal d'affectation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nouvelle affectation de matériel</h2>
                <p className="text-xs text-slate-500">
                  Attribuer un équipement disponible à un collaborateur ou à un service.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAffectation} className="mt-4 space-y-4 text-xs">
              {/* Choix de l'équipement disponible */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Équipement disponible (En stock) *
                </Label>
                {equipementsDispo.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Aucun équipement disponible en stock. Veuillez d'abord ajouter du matériel ou clôturer une affectation existante.
                  </div>
                ) : (
                  <select
                    value={selectedEqId}
                    onChange={(e) => setSelectedEqId(e.target.value)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    {equipementsDispo.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        [{formatCodeEquipement(eq.code)}] {eq.type} — {eq.marque} {eq.modele} ({eq.numero_serie || "S/N non renseigné"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Type de bénéficiaire */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Type de bénéficiaire *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCibleType("employe")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      cibleType === "employe"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>Employé nominatif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCibleType("service")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      cibleType === "service"
                        ? "bg-blue-50 border-blue-400 text-blue-800 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Service (matériel partagé)</span>
                  </button>
                </div>
              </div>

              {/* Si employé : sélection du service pour filtrer puis sélection employé */}
              {cibleType === "employe" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Département</Label>
                    <select
                      value={filterModalService}
                      onChange={(e) => setFilterModalService(e.target.value)}
                      className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    >
                      <option value="tous">Tous les départements</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Employé bénéficiaire *</Label>
                    <select
                      value={selectedCibleId}
                      onChange={(e) => setSelectedCibleId(e.target.value)}
                      className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                      required
                    >
                      {filteredEmployesForModal.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.prenom} {emp.nom} {emp.service_nom ? `(${emp.service_nom})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Service bénéficiaire *</Label>
                  <select
                    value={selectedCibleId}
                    onChange={(e) => setSelectedCibleId(e.target.value)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date début */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Date d'affectation *</Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required
                />
              </div>

              {/* Commentaire */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Motif / Commentaire</Label>
                <textarea
                  rows={2}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="ex: Matériel de fonction, renouvellement poste informatique..."
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || equipementsDispo.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Enregistrement...
                    </>
                  ) : (
                    "Valider l'affectation"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
