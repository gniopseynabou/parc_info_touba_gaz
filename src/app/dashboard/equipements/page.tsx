"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Laptop,
  Search,
  Plus,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  FileQuestion,
  Loader2,
  Trash2,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Equipement, EtatEquipement } from "@/types";
import { ETATS_EQUIPEMENTS, TYPES_EQUIPEMENTS, formatCodeEquipement } from "@/lib/constants";
import { toast } from "sonner";

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEtat, setFilterEtat] = useState<string>("tous");
  const [filterType, setFilterType] = useState<string>("tous");

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
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadEquipements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterEtat !== "tous") params.append("etat", filterEtat);
      if (filterType !== "tous") params.append("type", filterType);

      const res = await fetch(`/api/equipements?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEquipements(json.data);
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
    loadEquipements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEtat, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEquipements();
  };

  const handleCreateEquipement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formType) {
      toast.error("Le type d'équipement est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
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
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement ajouté au parc avec succès !");
        setIsModalOpen(false);
        // Réinitialisation
        setFormMarque("");
        setFormModele("");
        setFormNumSerie("");
        setFormDateAchat("");
        setFormLocalisation("");
        setFormDescription("");
        loadEquipements();
      } else {
        toast.error(json.message || "Erreur lors de la création.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (eq: Equipement) => {
    setEditingId(eq.id);
    setEditType(eq.type || TYPES_EQUIPEMENTS[0]);
    setEditMarque(eq.marque || "");
    setEditModele(eq.modele || "");
    setEditNumSerie(eq.numero_serie || "");
    setEditDateAchat(eq.date_achat ? eq.date_achat.slice(0, 10) : "");
    setEditEtat(eq.etat || "en_service");
    setEditLocalisation(eq.localisation || "");
    setEditDescription(eq.description || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSavingEdit(true);
    try {
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
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteEquipement = async (id: string, label: string) => {
    if (!confirm(`Confirmez-vous l'archivage de l'équipement ${label} ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/equipements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement archivé.");
        loadEquipements();
      } else {
        toast.error(json.message || "Erreur lors de l'archivage.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaire du parc informatique"
        description="Suivi technique, état, localisation et affectation des équipements Touba Gaz."
        icon={Laptop}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500 shadow-sm"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un équipement
        </Button>
      </PageHeader>

      {/* Barre de Filtres & Recherche */}
      <Card className="border-slate-800 bg-[#111c30] p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par type, marque, modèle, numéro de série, localisation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0b1220] border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-green-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-green-400" aria-hidden="true" />
              <span>Filtres :</span>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-xs text-white outline-none focus:border-green-500"
            >
              <option value="tous">Tous les types</option>
              {TYPES_EQUIPEMENTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterEtat}
              onChange={(e) => setFilterEtat(e.target.value)}
              className="h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-xs text-white outline-none focus:border-green-500"
            >
              <option value="tous">Tous les états</option>
              <option value="en_service">En service</option>
              <option value="en_panne">En panne</option>
              <option value="en_maintenance">En maintenance</option>
              <option value="reforme">Réformé</option>
            </select>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-slate-700 bg-[#0b1220] text-slate-200 hover:text-white"
            >
              Filtrer
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={loadEquipements}
              className="text-slate-400 hover:text-white"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des Équipements */}
      <Card className="border-slate-800 bg-[#111c30] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0b1220] border-b border-slate-800 text-slate-400 font-medium text-xs">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type & Désignation</th>
                <th className="py-3 px-4">N° de Série</th>
                <th className="py-3 px-4">État</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Affectation active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-500 mb-2" />
                    Chargement des équipements depuis MySQL...
                  </td>
                </tr>
              ) : equipements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    Aucun équipement ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                equipements.map((eq) => {
                  const etatInfo = ETATS_EQUIPEMENTS[eq.etat] || {
                    label: eq.etat,
                    badgeClass: "bg-slate-800 text-slate-400",
                    dotClass: "bg-slate-500",
                  };

                  return (
                    <tr key={eq.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-green-400 whitespace-nowrap">
                        {formatCodeEquipement(eq.code)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{eq.type}</div>
                        <div className="text-xs text-slate-400">
                          {eq.marque} {eq.modele}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {eq.numero_serie || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${etatInfo.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${etatInfo.dotClass}`} />
                          {etatInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {eq.localisation || "Non définie"}
                      </td>
                      <td className="py-3 px-4">
                        {eq.affectation_actuelle ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-950/40 border border-green-800/30 text-green-300 text-xs">
                            {eq.affectation_actuelle}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">En stock</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/equipements/${eq.id}`}>
                            <Button variant="ghost" size="xs" className="text-slate-300 hover:text-white hover:bg-slate-800">
                              <Eye className="h-3.5 w-3.5 mr-1 text-green-400" />
                              Fiche
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => openEditModal(eq)}
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                            title="Modifier rapidement"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-amber-400" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDeleteEquipement(eq.id, `${eq.type} (${eq.numero_serie || "S/N inconnu"})`)}
                            className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                            title="Archiver l'équipement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Modal d'ajout d'équipement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111c30] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Ajouter un équipement au parc</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipement} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Type de matériel *</Label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
                  <Label className="text-xs text-slate-300">État initial *</Label>
                  <select
                    value={formEtat}
                    onChange={(e) => setFormEtat(e.target.value as EtatEquipement)}
                    className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
                    required
                  >
                    <option value="en_service">En service</option>
                    <option value="en_panne">En panne</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="reforme">Réformé</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Marque</Label>
                  <Input
                    placeholder="ex: Dell, HP, Cisco..."
                    value={formMarque}
                    onChange={(e) => setFormMarque(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Modèle</Label>
                  <Input
                    placeholder="ex: Latitude 5420..."
                    value={formModele}
                    onChange={(e) => setFormModele(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Numéro de série (S/N)</Label>
                  <Input
                    placeholder="ex: SN-DELL-88219"
                    value={formNumSerie}
                    onChange={(e) => setFormNumSerie(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Date d'achat</Label>
                  <Input
                    type="date"
                    value={formDateAchat}
                    onChange={(e) => setFormDateAchat(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Localisation</Label>
                <Input
                  placeholder="ex: Bureau Informatique, Couloir R+1, Direction Générale..."
                  value={formLocalisation}
                  onChange={(e) => setFormLocalisation(e.target.value)}
                  className="bg-[#0b1220] border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Description / Configuration</Label>
                <textarea
                  rows={3}
                  placeholder="Processeur, RAM, stockage, particularités..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1220] border border-slate-700 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {isSubmitting ? "Enregistrement..." : "Ajouter l'équipement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition rapide */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111c30] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Modifier l'équipement</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Type de matériel *</Label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
                  <Label className="text-xs text-slate-300">État opérationnel *</Label>
                  <select
                    value={editEtat}
                    onChange={(e) => setEditEtat(e.target.value as EtatEquipement)}
                    className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
                    required
                  >
                    <option value="en_service">En service</option>
                    <option value="en_panne">En panne</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="reforme">Réformé</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Marque</Label>
                  <Input
                    value={editMarque}
                    onChange={(e) => setEditMarque(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Modèle</Label>
                  <Input
                    value={editModele}
                    onChange={(e) => setEditModele(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Numéro de série (S/N)</Label>
                  <Input
                    value={editNumSerie}
                    onChange={(e) => setEditNumSerie(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Date d'achat</Label>
                  <Input
                    type="date"
                    value={editDateAchat}
                    onChange={(e) => setEditDateAchat(e.target.value)}
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Localisation</Label>
                <Input
                  value={editLocalisation}
                  onChange={(e) => setEditLocalisation(e.target.value)}
                  className="bg-[#0b1220] border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Description</Label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1220] border border-slate-700 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-green-600 hover:bg-green-500 text-white gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
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
