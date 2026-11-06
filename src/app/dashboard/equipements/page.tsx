"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Laptop,
  Search,
  Plus,
  Eye,
  SlidersHorizontal,
  FileQuestion,
  Loader2,
  Trash2,
  Pencil,
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Wrench,
  Camera,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Equipement, EtatEquipement, Service } from "@/types";
import { ETATS_EQUIPEMENTS, TYPES_EQUIPEMENTS, formatCodeEquipement } from "@/lib/constants";
import { toast } from "sonner";

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState<string>("tous");
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterService, setFilterService] = useState<string>("tous");
  const [showServicesOverview, setShowServicesOverview] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    enService: 0,
    enPanne: 0,
    horsService: 0,
  });

  // Modal d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formType, setFormType] = useState(TYPES_EQUIPEMENTS[0]);
  const [formMarque, setFormMarque] = useState("");
  const [formModele, setFormModele] = useState("");
  const [formNumSerie, setFormNumSerie] = useState("");
  const [formDateAchat, setFormDateAchat] = useState("");
  const [formEtat, setFormEtat] = useState<EtatEquipement>("en_service");
  const [formLocalisation, setFormLocalisation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);

  // Modal d'édition rapide
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editMarque, setEditMarque] = useState("");
  const [editModele, setEditModele] = useState("");
  const [editNumSerie, setEditNumSerie] = useState("");
  const [editDateAchat, setEditDateAchat] = useState("");
  const [editEtat, setEditEtat] = useState<EtatEquipement>("en_service");
  const [editLocalisation, setEditLocalisation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadServices = async () => {
    try {
      const res = await fetch("/api/services");
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      }
    } catch {
      // ignore
    }
  };

  const loadEquipements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterEtat !== "tous") params.append("etat", filterEtat);
      if (filterType !== "tous") params.append("type", filterType);
      if (filterService !== "tous") params.append("service_id", filterService);

      const res = await fetch(`/api/equipements?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEquipements(json.data);
        if (json.stats) {
          setGlobalStats(json.stats);
        }
      } else {
        toast.error("Erreur de chargement des équipements.");
      }
    } catch {
      toast.error("Impossible de contacter le serveur MySQL.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const etat = sp.get("etat");
      const srv = sp.get("service_id");
      if (etat) setFilterEtat(etat);
      if (srv) setFilterService(srv);
    }
  }, []);

  useEffect(() => {
    loadEquipements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEtat, filterType, filterService]);

  // Statistiques calculées directement depuis les données
  const stats = useMemo(() => {
    const total = equipements.length;
    let enService = 0;
    let enPanne = 0;
    let horsService = 0;

    for (const eq of equipements) {
      if (eq.etat === "en_service") enService++;
      else if (eq.etat === "en_panne" || eq.etat === "en_maintenance") enPanne++;
      else if (eq.etat === "hors_service" || (eq.etat as any) === "reforme") horsService++;
    }

    return { total, enService, enPanne, horsService };
  }, [equipements]);

  // Répartition des équipements par service (pour affichage clair sans popup au survol)
  const serviceStats = useMemo(() => {
    const map = new Map<string, { id: string; nom: string; count: number }>();
    services.forEach((s) => {
      map.set(s.id, { id: s.id, nom: s.nom, count: 0 });
    });

    let nonAffectesCount = 0;
    equipements.forEach((eq) => {
      if (eq.service_id && map.has(eq.service_id)) {
        map.get(eq.service_id)!.count++;
      } else if (!eq.affectation_actuelle) {
        nonAffectesCount++;
      }
    });

    return {
      list: Array.from(map.values()),
      nonAffectesCount,
    };
  }, [equipements, services]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEquipements();
  };

  // Gestion de la sélection de photo
  const handlePhotoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formats acceptés : JPG, JPEG, PNG, WEBP.");
      return;
    }

    setFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/equipements/upload", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json.photoUrl;
    }
    throw new Error(json.message || "Échec de l'upload de la photo.");
  };

  const handleCreateEquipement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (formPhotoFile) {
        photoUrl = await uploadPhoto(formPhotoFile);
      }

      const res = await fetch("/api/equipements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          marque: formMarque,
          modele: formModele,
          numero_serie: formNumSerie,
          date_achat: formDateAchat || null,
          etat: formEtat,
          localisation: formLocalisation,
          description: formDescription,
          photo: photoUrl,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement ajouté au parc avec succès.");
        setIsModalOpen(false);
        // Reset form
        setFormMarque("");
        setFormModele("");
        setFormNumSerie("");
        setFormDateAchat("");
        setFormLocalisation("");
        setFormDescription("");
        setFormPhotoFile(null);
        setFormPhotoPreview(null);
        loadEquipements();
      } else {
        toast.error(json.message || "Erreur lors de l'ajout.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (eq: Equipement) => {
    setEditingId(eq.id);
    setEditType(eq.type);
    setEditMarque(eq.marque || "");
    setEditModele(eq.modele || "");
    setEditNumSerie(eq.numero_serie || "");
    setEditDateAchat(eq.date_achat ? eq.date_achat.slice(0, 10) : "");
    setEditEtat((eq.etat as any) === "reforme" ? "hors_service" : (eq.etat || "en_service"));
    setEditLocalisation(eq.localisation || "");
    setEditDescription(eq.description || "");
    setEditPhotoUrl(eq.photo || null);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSavingEdit(true);
    try {
      let photoToSave = editPhotoUrl;
      if (editPhotoFile) {
        photoToSave = await uploadPhoto(editPhotoFile);
      }

      const res = await fetch(`/api/equipements/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          marque: editMarque,
          modele: editModele,
          numero_serie: editNumSerie,
          date_achat: editDateAchat || null,
          etat: editEtat,
          localisation: editLocalisation,
          description: editDescription,
          photo: photoToSave,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement mis à jour avec succès.");
        setIsEditModalOpen(false);
        loadEquipements();
      } else {
        toast.error(json.message || "Erreur de mise à jour.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEquipement = async (id: string, label: string) => {
    const confirmation = window.confirm(`Confirmez-vous l'archivage de l'équipement « ${label} » ?`);
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/equipements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement archivé.");
        loadEquipements();
      } else {
        toast.error(json.message || "Impossible d'archiver.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaire du parc informatique"
        description="Suivi technique, état, photos, localisation et affectation des équipements Touba Gaz."
        icon={Laptop}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un équipement
        </Button>
      </PageHeader>

      {/* 3.1 Cartes statistiques cliquables pour filtrer */}
      <section aria-label="Statistiques des équipements">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total */}
          <button
            type="button"
            onClick={() => setFilterEtat("tous")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterEtat === "tous"
                ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Total Équipements</span>
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Laptop className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tabular-nums">
              {globalStats.total}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {filterEtat === "tous" ? "✓ Filtre actif" : "Cliquer pour tout afficher"}
            </p>
          </button>

          {/* En service */}
          <button
            type="button"
            onClick={() => setFilterEtat(filterEtat === "en_service" ? "tous" : "en_service")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterEtat === "en_service"
                ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">En service</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
              {globalStats.enService}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              {filterEtat === "en_service" ? "✓ Filtré : En service" : "Cliquer pour filtrer"}
            </p>
          </button>

          {/* En panne */}
          <button
            type="button"
            onClick={() => setFilterEtat(filterEtat === "en_panne" ? "tous" : "en_panne")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterEtat === "en_panne"
                ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">En panne / Maint.</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Wrench className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2 tabular-nums">
              {globalStats.enPanne}
            </p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">
              {filterEtat === "en_panne" ? "✓ Filtré : En panne" : "Cliquer pour filtrer"}
            </p>
          </button>

          {/* Hors service */}
          <button
            type="button"
            onClick={() => setFilterEtat(filterEtat === "hors_service" ? "tous" : "hors_service")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterEtat === "hors_service"
                ? "bg-white border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Hors service</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Ban className="size-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-rose-700 mt-2 tabular-nums">
              {globalStats.horsService}
            </p>
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {filterEtat === "hors_service" ? "✓ Filtré : Hors service" : "Cliquer pour filtrer"}
            </p>
          </button>
        </div>
      </section>

      {/* 3.2 Affichage des équipements par service (stable, responsive, sans popup au survol) */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Équipements par service
            </h2>
            <span className="text-xs text-slate-400">({services.length} départements)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowServicesOverview(!showServicesOverview)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto cursor-pointer"
          >
            {showServicesOverview ? "Masquer les services ▲" : "Afficher les services ▼"}
          </button>
        </div>

        {showServicesOverview && (
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {serviceStats.list.map((srv) => (
              <div
                key={srv.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" title={srv.nom}>
                    {srv.nom}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {srv.count} équipement{srv.count > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilterService(srv.id)}
                  className={`h-7 px-2 text-[11px] shrink-0 ${
                    filterService === srv.id
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  Voir
                </Button>
              </div>
            ))}

            {/* Carte En stock / Non affectés */}
            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  📦 Stock / Non affectés
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {serviceStats.nonAffectesCount} disponible{serviceStats.nonAffectesCount > 1 ? "s" : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterService("non_affectes")}
                className={`h-7 px-2 text-[11px] shrink-0 ${
                  filterService === "non_affectes"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-slate-200 text-slate-700 hover:bg-white"
                }`}
              >
                Voir
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Barre de Filtres unifiée & Recherche */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par type, marque, modèle, numéro de série, bénéficiaire..."
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

            {/* Filtre par Service */}
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              title="Filtrer par service"
            >
              <option value="tous">Tous les services</option>
              <option value="non_affectes">📦 Non affectés (En stock)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>

            {/* Filtre par Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="tous">Tous les types</option>
              {TYPES_EQUIPEMENTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {(filterEtat !== "tous" || filterType !== "tous" || filterService !== "tous" || search) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterEtat("tous");
                  setFilterType("tous");
                  setFilterService("tous");
                  setSearch("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 h-10 px-2"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Tableau des Équipements */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type & Désignation</th>
                <th className="py-3 px-4">N° de Série</th>
                <th className="py-3 px-4">État</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Affectation active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement du parc informatique...
                  </td>
                </tr>
              ) : equipements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Aucun équipement ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                equipements.map((eq) => {
                  const etatInfo = ETATS_EQUIPEMENTS[eq.etat] || {
                    label: eq.etat === ("reforme" as any) ? "Hors service" : eq.etat,
                    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
                    dotClass: "bg-slate-400",
                  };

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Vignette photo */}
                      <td className="py-2.5 px-4">
                        {eq.photo ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={eq.photo}
                              alt={eq.type}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center text-slate-300 shrink-0">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {formatCodeEquipement(eq.code)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{eq.type}</div>
                        <div className="text-xs text-slate-500">
                          {eq.marque} {eq.modele ? `· ${eq.modele}` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {eq.numero_serie || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${etatInfo.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${etatInfo.dotClass}`} />
                          {etatInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {eq.localisation || "—"}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {eq.affectation_actuelle ? (
                          <span className="font-semibold text-slate-800 block">
                            {eq.affectation_actuelle}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400 italic">
                            Non affecté (En stock)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/equipements/${eq.id}`}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Voir la fiche détaillée"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(eq)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Modifier l'équipement"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteEquipement(
                                eq.id,
                                `${eq.type} ${eq.marque || ""} ${eq.modele || ""}`
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archiver l'équipement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal d'ajout d'équipement avec gestion de photo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Ajouter un équipement au parc</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipement} className="mt-4 space-y-4">
              {/* Champ Photo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Photo de l'équipement</Label>
                <div className="flex items-center gap-4">
                  {formPhotoPreview ? (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formPhotoPreview} alt="Aperçu" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormPhotoFile(null);
                          setFormPhotoPreview(null);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600"
                        title="Supprimer la photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Camera className="h-5 w-5 mb-1 text-slate-400" />
                      <span className="text-[9px]">Photo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition-colors">
                      <Upload className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{formPhotoPreview ? "Changer de photo" : "Choisir une photo"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handlePhotoSelect(e, setFormPhotoFile, setFormPhotoPreview)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Formats : JPG, PNG, WEBP (Max 5 Mo)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Type de matériel *</Label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    {TYPES_EQUIPEMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">État initial *</Label>
                  <select
                    value={formEtat}
                    onChange={(e) => setFormEtat(e.target.value as EtatEquipement)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    <option value="en_service">En service</option>
                    <option value="en_panne">En panne</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="hors_service">Hors service</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Marque</Label>
                  <Input
                    placeholder="ex: Dell, HP, Cisco..."
                    value={formMarque}
                    onChange={(e) => setFormMarque(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Modèle</Label>
                  <Input
                    placeholder="ex: Latitude 5420..."
                    value={formModele}
                    onChange={(e) => setFormModele(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Numéro de série (S/N)</Label>
                  <Input
                    placeholder="ex: SN-DELL-88219"
                    value={formNumSerie}
                    onChange={(e) => setFormNumSerie(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Date d'achat</Label>
                  <Input
                    type="date"
                    value={formDateAchat}
                    onChange={(e) => setFormDateAchat(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Localisation géographique</Label>
                <Input
                  placeholder="ex: Bureau Informatique, RDC Salle Serveur, Bureau Comptabilité..."
                  value={formLocalisation}
                  onChange={(e) => setFormLocalisation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Observations / Configuration</Label>
                <textarea
                  rows={2}
                  placeholder="Spécifications techniques, processeur, RAM..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Ajout...
                    </>
                  ) : (
                    "Ajouter au parc"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition rapide avec photo */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Modifier l'équipement</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {/* Photo existante ou modifiée */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Photo de l'équipement</Label>
                <div className="flex items-center gap-4">
                  {editPhotoPreview || editPhotoUrl ? (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editPhotoPreview || editPhotoUrl || ""}
                        alt="Photo de l'équipement"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhotoUrl(null);
                          setEditPhotoFile(null);
                          setEditPhotoPreview(null);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 cursor-pointer"
                        title="Supprimer la photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Camera className="h-5 w-5 mb-1 text-slate-400" />
                      <span className="text-[9px]">Aucune</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition-colors">
                      <Upload className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{editPhotoUrl || editPhotoPreview ? "Remplacer la photo" : "Ajouter une photo"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handlePhotoSelect(e, setEditPhotoFile, setEditPhotoPreview)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Formats : JPG, PNG, WEBP (Max 5 Mo)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Type de matériel *</Label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    {TYPES_EQUIPEMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">État opérationnel *</Label>
                  <select
                    value={editEtat}
                    onChange={(e) => setEditEtat(e.target.value as EtatEquipement)}
                    className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    required
                  >
                    <option value="en_service">En service</option>
                    <option value="en_panne">En panne</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="hors_service">Hors service</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Marque</Label>
                  <Input
                    value={editMarque}
                    onChange={(e) => setEditMarque(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Modèle</Label>
                  <Input
                    value={editModele}
                    onChange={(e) => setEditModele(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Numéro de série (S/N)</Label>
                  <Input
                    value={editNumSerie}
                    onChange={(e) => setEditNumSerie(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Date d'achat</Label>
                  <Input
                    type="date"
                    value={editDateAchat}
                    onChange={(e) => setEditDateAchat(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Localisation</Label>
                <Input
                  value={editLocalisation}
                  onChange={(e) => setEditLocalisation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Description</Label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer"
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
