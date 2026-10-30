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
  X,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // État du modal d'ajout
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

  const loadEquipements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterEtat !== "tous") params.append("etat", filterEtat);

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
  }, [filterEtat]);

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
          date_achat: formDateAchat,
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
        description="Suivi technique, état et localisation des équipements Touba Gaz."
        icon={Laptop}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un équipement
        </Button>
      </PageHeader>

      {/* Barre de Filtres & Recherche */}
      <Card className="border-slate-800 bg-slate-900/80 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par type, marque, modèle, numéro de série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-green-400" aria-hidden="true" />
              <span>État :</span>
            </div>
            <select
              value={filterEtat}
              onChange={(e) => setFilterEtat(e.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
              className="border-slate-700 bg-slate-950 text-slate-200 hover:text-white"
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
      <Card className="border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0d1728] border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type & Désignation</th>
                <th className="py-3 px-4">N° de Série</th>
                <th className="py-3 px-4">État</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Affectation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-400 mb-2" />
                    Chargement des équipements depuis MySQL...
                  </td>
                </tr>
              ) : equipements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    Aucun équipement ne correspond à votre recherche.
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
                      <td className="py-3 px-4 font-mono font-bold text-teal-400 whitespace-nowrap">
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
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${etatInfo.badgeClass}`}>
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
                          <span className="text-slate-400 text-xs italic">Non affecté</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/dashboard/equipements/${eq.id}`}>
                            <Button variant="ghost" size="xs" className="text-slate-400 hover:text-white hover:bg-slate-800">
                              <Eye className="h-3.5 w-3.5 mr-1 text-teal-400" />
                              Détail
                            </Button>
                          </Link>
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

      {/* Modal d'Ajout d'Équipement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Nouvel Équipement
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Enregistrer un matériel dans le parc Touba Gaz
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateEquipement}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="type" className="text-slate-300">
                    Type de matériel *
                  </Label>
                  <select
                    id="type"
                    required
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    {TYPES_EQUIPEMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="marque" className="text-slate-300">
                      Marque
                    </Label>
                    <Input
                      id="marque"
                      placeholder="ex: Dell, HP, Cisco..."
                      value={formMarque}
                      onChange={(e) => setFormMarque(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="modele" className="text-slate-300">
                      Modèle
                    </Label>
                    <Input
                      id="modele"
                      placeholder="ex: Latitude 5420"
                      value={formModele}
                      onChange={(e) => setFormModele(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="num_serie" className="text-slate-300">
                      Numéro de série
                    </Label>
                    <Input
                      id="num_serie"
                      placeholder="SN-XXXXX"
                      value={formNumSerie}
                      onChange={(e) => setFormNumSerie(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="etat" className="text-slate-300">
                      État initial
                    </Label>
                    <select
                      id="etat"
                      value={formEtat}
                      onChange={(e) => setFormEtat(e.target.value as EtatEquipement)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                    >
                      <option value="en_service">En service</option>
                      <option value="en_maintenance">En maintenance</option>
                      <option value="en_panne">En panne</option>
                      <option value="reforme">Réformé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="date_achat" className="text-slate-300">
                      Date d&apos;achat
                    </Label>
                    <Input
                      id="date_achat"
                      type="date"
                      value={formDateAchat}
                      onChange={(e) => setFormDateAchat(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="loc" className="text-slate-300">
                      Localisation
                    </Label>
                    <Input
                      id="loc"
                      placeholder="ex: Bureau Informatique"
                      value={formLocalisation}
                      onChange={(e) => setFormLocalisation(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc" className="text-slate-300">
                    Caractéristiques / Remarques
                  </Label>
                  <textarea
                    id="desc"
                    rows={2}
                    placeholder="ex: Core i7, 16 Go RAM, SSD 512 Go..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-500"
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
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer l'équipement"
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
