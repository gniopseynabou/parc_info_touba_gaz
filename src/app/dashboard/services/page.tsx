"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  RefreshCw,
  Users,
  Laptop,
  Loader2,
  X,
  FileQuestion,
  Edit2,
  Archive,
  Eye,
  CheckCircle2,
  Share2,
  ArrowRight,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Service, Employe, Equipement } from "@/types";
import { formatCodeEquipement, formatDateFr, ETATS_EQUIPEMENTS } from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface ServiceDetail extends Service {
  employes: Employe[];
  equipements_communs: any[];
  equipements_individuels: any[];
  total_employes: number;
  total_equipements_communs: number;
  total_equipements_individuels: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Modal Édition
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  // Modal Détail / Ressources du Service (Item 5)
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<"employes" | "communs" | "individuels">("employes");

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services");
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      } else {
        toast.error("Erreur de chargement des services.");
      }
    } catch {
      toast.error("Impossible de contacter le serveur MySQL.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openServiceDetail = async (srv: Service) => {
    setIsLoadingDetail(true);
    setSelectedServiceDetail(null);
    setDetailTab("employes");
    try {
      const res = await fetch(`/api/services/${srv.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSelectedServiceDetail(json.data);
      } else {
        toast.error("Impossible de charger les ressources du service.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom?.trim()) {
      toast.error("Le nom du service est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formNom,
          description: formDescription,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Service « ${formNom} » créé avec succès.`);
        setIsModalOpen(false);
        setFormNom("");
        setFormDescription("");
        loadServices();
      } else {
        toast.error(json.message || "Erreur de création.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setEditNom(srv.nom);
    setEditDescription(srv.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editNom.trim()) return;

    setIsEditingSubmitting(true);
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editNom,
          description: editDescription,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Service mis à jour avec succès.");
        setEditingService(null);
        loadServices();
      } else {
        toast.error(json.message || "Erreur de mise à jour.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleArchiveService = async (srv: Service) => {
    const confirmation = window.confirm(
      `Confirmez-vous l'archivage du service « ${srv.nom} » ?`
    );
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/services/${srv.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Service archivé avec succès.");
        loadServices();
      } else {
        toast.error(json.message || "Impossible d'archiver ce service.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <PageHeader
        title="Services de l’entreprise"
        description="Directions et départements fonctionnels de Touba Gaz SA."
        icon={Building2}
      >
        <Button
          variant="outline"
          size="default"
          onClick={loadServices}
          className="h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-emerald-600" : ""}`} aria-hidden="true" />
          Actualiser
        </Button>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau service
        </Button>
      </PageHeader>

      {/* Cartes / Liste des Services */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
          Chargement des départements...
        </div>
      ) : services.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          Aucun service configuré pour le moment.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <Card
              key={srv.id}
              className="border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openServiceDetail(srv)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Consulter les ressources rattachées (employés & équipements)"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Modifier les coordonnées du service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchiveService(srv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Archiver ce service"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">
                  {srv.nom}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2">
                  {srv.description || "Aucune description renseignée."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-600" />
                      Collaborateurs
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {srv.total_employes ?? 0}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Laptop className="h-3 w-3 text-blue-600" />
                      Équipements
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {srv.total_equipements ?? 0}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => openServiceDetail(srv)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-800 gap-1.5 font-medium"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  Voir les ressources du service
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Détail des Ressources du Service (Item 5) */}
      {(isLoadingDetail || selectedServiceDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Ressources du service : {selectedServiceDetail?.nom}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedServiceDetail?.description || "Département fonctionnel Touba Gaz"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetail || !selectedServiceDetail ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement des ressources...
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Onglets de vue détaillée */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <button
                    type="button"
                    onClick={() => setDetailTab("employes")}
                    className={`pb-2 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      detailTab === "employes"
                        ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Collaborateurs rattachés ({selectedServiceDetail.employes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab("communs")}
                    className={`pb-2 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      detailTab === "communs"
                        ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Matériels partagés du service ({selectedServiceDetail.equipements_communs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab("individuels")}
                    className={`pb-2 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      detailTab === "individuels"
                        ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    Matériels individuels ({selectedServiceDetail.equipements_individuels.length})
                  </button>
                </div>

                {/* Contenu Onglet 1 : Employés */}
                {detailTab === "employes" && (
                  <div className="space-y-2">
                    {selectedServiceDetail.employes.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        Aucun collaborateur n'est actuellement rattaché à ce département.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        {selectedServiceDetail.employes.map((emp) => (
                          <div key={emp.id} className="p-3 bg-white flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[11px]">
                                {emp.prenom?.[0]}{emp.nom?.[0]}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {emp.prenom} {emp.nom}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {emp.email || emp.telephone || "Sans contact direct"}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              {emp.actif ? "Actif" : "Inactif"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Contenu Onglet 2 : Équipements communs (partagés) */}
                {detailTab === "communs" && (
                  <div className="space-y-2">
                    {selectedServiceDetail.equipements_communs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        Aucun matériel partagé n'est directement affecté à ce service (ex: imprimante réseau, vidéoprojecteur, switch).
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        {selectedServiceDetail.equipements_communs.map((eq: any) => {
                          const etat = ETATS_EQUIPEMENTS[eq.etat as keyof typeof ETATS_EQUIPEMENTS] || { label: eq.etat, badgeClass: "" };
                          return (
                            <div key={eq.id} className="p-3 bg-white flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-700">
                                    {formatCodeEquipement(eq.code)}
                                  </span>
                                  <span className="font-semibold text-slate-900">{eq.type}</span>
                                  <span className="text-slate-500">· {eq.marque} {eq.modele}</span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                  S/N : {eq.numero_serie || "Non renseigné"} · Depuis le {formatDateFr(eq.affectation_date_debut)}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${etat.badgeClass}`}>
                                {etat.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Contenu Onglet 3 : Équipements individuels */}
                {detailTab === "individuels" && (
                  <div className="space-y-2">
                    {selectedServiceDetail.equipements_individuels.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        Aucun équipement individuel n'est affecté aux collaborateurs de ce service.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        {selectedServiceDetail.equipements_individuels.map((eq: any) => {
                          const etat = ETATS_EQUIPEMENTS[eq.etat as keyof typeof ETATS_EQUIPEMENTS] || { label: eq.etat, badgeClass: "" };
                          return (
                            <div key={eq.id} className="p-3 bg-white flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-700">
                                    {formatCodeEquipement(eq.code)}
                                  </span>
                                  <span className="font-semibold text-slate-900">{eq.type}</span>
                                  <span className="text-slate-500">· {eq.marque} {eq.modele}</span>
                                </div>
                                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                                  Affecté à : <strong>{eq.employe_nom}</strong>
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${etat.badgeClass}`}>
                                {etat.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/dashboard/affectations?service_id=${selectedServiceDetail.id}`}>
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 gap-1.5 text-xs">
                      <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                      Gérer les affectations pour ce service
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    onClick={() => setSelectedServiceDetail(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ajout Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  Nouveau Service
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Créer une direction ou un département interne
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateService}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="nom" className="text-slate-700 font-semibold">
                    Intitulé du service *
                  </Label>
                  <Input
                    id="nom"
                    required
                    placeholder="ex: Direction Commerciale & Marketing"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-slate-700 font-semibold">
                    Description & Rôle opérationnel
                  </Label>
                  <textarea
                    id="desc"
                    rows={3}
                    placeholder="Mission principale, localisation du bureau, effectif..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    {isSubmitting ? "Création..." : "Créer le service"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Modification Service */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Modifier le Service
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {editingService.nom} (Réf : {editingService.id})
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveEdit}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-nom" className="text-slate-700 font-semibold">
                    Intitulé du service *
                  </Label>
                  <Input
                    id="edit-nom"
                    required
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-desc" className="text-slate-700 font-semibold">
                    Description & Rôle opérationnel
                  </Label>
                  <textarea
                    id="edit-desc"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingService(null)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditingSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    {isEditingSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
