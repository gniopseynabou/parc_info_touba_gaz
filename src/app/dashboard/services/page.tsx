"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Service } from "@/types";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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
        toast.success("Service créé avec succès !");
        setIsModalOpen(false);
        setFormNom("");
        setFormDescription("");
        loadServices();
      } else {
        toast.error(json.message || "Erreur lors de la création.");
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

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editNom?.trim()) {
      toast.error("Le nom du service est requis.");
      return;
    }

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
        toast.success("Service mis à jour avec succès !");
        setEditingService(null);
        loadServices();
      } else {
        toast.error(json.message || "Erreur lors de la mise à jour.");
      }
    } catch {
      toast.error("Erreur serveur lors de la modification.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleArchiveService = async (srv: Service) => {
    if ((srv.total_employes ?? 0) > 0) {
      toast.error(`Impossible d'archiver : ${srv.total_employes} employé(s) sont rattachés à ce service.`);
      return;
    }
    if ((srv.total_equipements ?? 0) > 0) {
      toast.error(`Impossible d'archiver : ${srv.total_equipements} équipement(s) sont actuellement affectés à ce service.`);
      return;
    }

    const conf = window.confirm(`Voulez-vous vraiment archiver le département "${srv.nom}" ?`);
    if (!conf) return;

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
          className="h-10 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-green-400" : ""}`} aria-hidden="true" />
          Actualiser
        </Button>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500 font-medium shadow-md shadow-green-600/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau service
        </Button>
      </PageHeader>

      {/* Cartes / Liste des Services */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-400 mb-2" />
          Chargement des départements...
        </div>
      ) : services.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/80 p-12 text-center text-slate-500">
          <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          Aucun service configuré pour le moment.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <Card key={srv.id} className="border-slate-800 bg-slate-900/80 hover:border-green-500/30 transition-all shadow-md flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {srv.id}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Modifier le service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchiveService(srv)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Archiver le service"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-white mt-2">
                  {srv.nom}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 line-clamp-2">
                  {srv.description || "Aucune description renseignée."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="h-3 w-3 text-green-400" />
                      Employés
                    </span>
                    <span className="font-bold text-white text-sm">
                      {srv.total_employes ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Laptop className="h-3 w-3 text-emerald-400" />
                      Équipements
                    </span>
                    <span className="font-bold text-white text-sm">
                      {srv.total_equipements ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Ajout Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-slate-800 bg-[#0c1524] text-slate-100 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-400" />
                  Nouveau Service
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Créer un département dans Touba Gaz
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateService}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="nom" className="text-slate-300">
                    Nom du service *
                  </Label>
                  <Input
                    id="nom"
                    required
                    placeholder="ex: Sécurité & QHSE"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc" className="text-slate-300">
                    Description des activités
                  </Label>
                  <textarea
                    id="desc"
                    rows={3}
                    placeholder="Missions et responsabilités du département..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-green-500"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Création...
                    </>
                  ) : (
                    "Créer le service"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Modification Service (CU03) */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-slate-800 bg-[#0c1524] text-slate-100 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-green-400" />
                  Modifier le Service
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Réf : {editingService.id}
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleUpdateService}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="edit_nom" className="text-slate-300">
                    Nom du service *
                  </Label>
                  <Input
                    id="edit_nom"
                    required
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_desc" className="text-slate-300">
                    Description des activités
                  </Label>
                  <textarea
                    id="edit_desc"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-green-500"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingService(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isEditingSubmitting}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  {isEditingSubmitting ? (
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
          </Card>
        </div>
      )}
    </div>
  );
}
