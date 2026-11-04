"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Users,
  Laptop,
  Loader2,
  X,
  FileQuestion,
  Edit2,
  Archive,
  ArchiveRestore,
  Eye,
  CheckCircle2,
  Share2,
  User,
  AlertCircle,
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
  const [archivedServices, setArchivedServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<"actifs" | "archives">("actifs");
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
  const [detailTab, setDetailTab] = useState<"employes" | "equipements">("employes");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resActifs, resArchives] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/services?archive=1"),
      ]);

      const jsonActifs = await resActifs.json();
      const jsonArchives = await resArchives.json();

      if (jsonActifs.success) setServices(jsonActifs.data || []);
      if (jsonArchives.success) setArchivedServices(jsonArchives.data || []);
    } catch {
      toast.error("Impossible de contacter le serveur MySQL.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openServiceDetail = async (srv: Service, tab: "employes" | "equipements" = "employes") => {
    setIsLoadingDetail(true);
    setSelectedServiceDetail(null);
    setDetailTab(tab);
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
        loadData();
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
        loadData();
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
      `Confirmez-vous l'archivage du service « ${srv.nom} » ?\n\nCe service sera déplacé dans la rubrique des services archivés sans suppression de ses données historiques.`
    );
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/services/${srv.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Service « ${srv.nom} » archivé.`);
        loadData();
      } else {
        toast.error(json.message || "Impossible d'archiver ce service.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  const handleDesarchiverService = async (srv: Service) => {
    const confirmation = window.confirm(
      `Confirmez-vous le désarchivage du service « ${srv.nom} » ?\n\nIl sera replacé dans la liste des services actifs et sera de nouveau disponible.`
    );
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/services/${srv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: 0 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Service « ${srv.nom} » réactivé avec succès.`);
        loadData();
      } else {
        toast.error(json.message || "Impossible de désarchiver ce service.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  const currentList = activeTab === "actifs" ? services : archivedServices;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <PageHeader
        title="Services & Départements"
        description="Directions et entités organisationnelles de Touba Gaz SA."
        icon={Building2}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau service
        </Button>
      </PageHeader>

      {/* Onglets clairs : Services actifs / Services archivés */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("actifs")}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === "actifs"
              ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Services actifs
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("archives")}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === "archives"
              ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <Archive className="h-4 w-4 text-slate-400" />
          Services archivés
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
            {archivedServices.length}
          </span>
        </button>
      </div>

      {/* Message d'information si onglet archivé */}
      {activeTab === "archives" && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Archive className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Historique des services archivés</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ces services ne sont plus proposés dans les formulaires d'affectation ou de création. Leurs historiques et dotations passées sont intégralement conservés. Vous pouvez à tout moment réactiver un service via l'action « Désarchiver ».
            </p>
          </div>
        </div>
      )}

      {/* Cartes / Liste des Services */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
          Chargement des services...
        </div>
      ) : currentList.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
          <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          {activeTab === "actifs"
            ? "Aucun service actif configuré pour le moment."
            : "Aucun service n'est actuellement archivé."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((srv) => (
            <Card
              key={srv.id}
              className={`border bg-white transition-all shadow-xs flex flex-col justify-between ${
                srv.archive
                  ? "border-slate-200 opacity-90 hover:border-slate-300"
                  : "border-slate-200 hover:border-emerald-300"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`p-2.5 rounded-xl ring-1 ${
                      srv.archive
                        ? "bg-slate-100 text-slate-500 ring-slate-200"
                        : "bg-emerald-50 text-emerald-600 ring-emerald-200/50"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openServiceDetail(srv)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Consulter les ressources rattachées (employés & équipements)"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!srv.archive ? (
                      <>
                        <button
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier les coordonnées du service"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveService(srv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Archiver ce service"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDesarchiverService(srv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        title="Désarchiver et réactiver ce service"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                        <span>Désarchiver</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">
                    {srv.nom}
                  </CardTitle>
                  {srv.archive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                      Archivé
                    </span>
                  )}
                </div>

                <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {srv.description || "Aucune description renseignée."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => openServiceDetail(srv, "employes")}
                    aria-label={`Voir les collaborateurs du service ${srv.nom}`}
                    className="group w-full cursor-pointer rounded-lg border border-slate-200/60 bg-slate-50 p-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="flex items-center justify-between gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-emerald-600" />
                        Collaborateurs
                      </span>
                      <Eye className="h-3 w-3 text-slate-400 transition-colors group-hover:text-emerald-600" />
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {srv.total_employes ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openServiceDetail(srv, "equipements")}
                    aria-label={`Voir les équipements du service ${srv.nom}`}
                    className="group w-full cursor-pointer rounded-lg border border-slate-200/60 bg-slate-50 p-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex items-center justify-between gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Laptop className="h-3 w-3 text-blue-600" />
                        Équipements
                      </span>
                      <Eye className="h-3 w-3 text-slate-400 transition-colors group-hover:text-blue-600" />
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {srv.total_equipements ?? 0}
                    </span>
                  </button>
                </div>

                <Button
                  onClick={() => openServiceDetail(srv)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-800 gap-1.5 font-medium cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  Consulter les ressources
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Détail des Ressources du Service (Item 5) */}
      {(isLoadingDetail || selectedServiceDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedServiceDetail?.nom}
                    </h2>
                    {selectedServiceDetail?.archive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                        Service archivé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedServiceDetail?.description || "Aucune description."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServiceDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  Chargement des ressources rattachées...
                </div>
              ) : selectedServiceDetail ? (
                <>
                  {/* Onglets Collaborateurs / Équipements */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setDetailTab("employes")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        detailTab === "employes"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Collaborateurs ({selectedServiceDetail.employes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab("equipements")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        detailTab === "equipements"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Équipements ({selectedServiceDetail.total_equipements})
                    </button>
                  </div>

                  {detailTab === "employes" && (
                    <div className="space-y-2">
                      {selectedServiceDetail.employes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">
                          Aucun collaborateur rattaché à ce service.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedServiceDetail.employes.map((emp) => (
                            <div
                              key={emp.id}
                              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                                  {emp.prenom[0]}
                                  {emp.nom[0]}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">
                                    {emp.prenom} {emp.nom}
                                  </p>
                                  <p className="text-[11px] text-slate-500">{emp.email || "Sans e-mail"}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === "equipements" && (
                    <div className="space-y-4">
                      {/* Communs */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Matériels partagés du service ({selectedServiceDetail.equipements_communs.length})
                        </h3>
                        {selectedServiceDetail.equipements_communs.length === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">
                            Aucun équipement partagé direct.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedServiceDetail.equipements_communs.map((eq: any) => (
                              <div
                                key={eq.id}
                                className="p-3 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-mono font-bold text-blue-600 block">
                                    {formatCodeEquipement(eq.code)}
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {eq.type} — {eq.marque} {eq.modele}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Individuels */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Équipements en dotation individuelle ({selectedServiceDetail.equipements_individuels.length})
                        </h3>
                        {selectedServiceDetail.equipements_individuels.length === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">
                            Aucune dotation individuelle.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedServiceDetail.equipements_individuels.map((eq: any) => (
                              <div
                                key={eq.id}
                                className="p-3 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-mono font-bold text-emerald-600 block">
                                    {formatCodeEquipement(eq.code)}
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {eq.type} — {eq.marque} {eq.modele}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    Dotation : {eq.employe_nom}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedServiceDetail(null)}
                className="border-slate-200 text-slate-700 hover:bg-white text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Créer un nouveau service</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="snom" className="text-slate-700 font-semibold">
                  Nom du service *
                </Label>
                <Input
                  id="snom"
                  required
                  placeholder="ex: Direction Commerciale, Atelier Gaz..."
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sdesc" className="text-slate-700 font-semibold">
                  Description / Missions
                </Label>
                <textarea
                  id="sdesc"
                  rows={3}
                  placeholder="Missions, activités et localisation du département..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Création...
                    </>
                  ) : (
                    "Créer le service"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition de service */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Modifier le service</h2>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="editsnom" className="text-slate-700 font-semibold">
                  Nom du service *
                </Label>
                <Input
                  id="editsnom"
                  required
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editsdesc" className="text-slate-700 font-semibold">
                  Description
                </Label>
                <textarea
                  id="editsdesc"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingService(null)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {isEditingSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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
