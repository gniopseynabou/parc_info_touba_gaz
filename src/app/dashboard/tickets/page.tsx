"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Wrench,
  Loader2,
  X,
  FileQuestion,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Ticket, Employe, Equipement, StatutTicket, PrioriteTicket, CanalTicket } from "@/types";
import {
  STATUTS_TICKETS,
  PRIORITES_TICKETS,
  CANAUX_TICKETS,
  CATEGORIES_TICKETS,
  formatNumeroTicket,
  formatDateFr,
} from "@/lib/constants";
import { toast } from "sonner";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [filterPriorite, setFilterPriorite] = useState<string>("tous");

  // Modal Nouveau Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDemandeurId, setFormDemandeurId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategorie, setFormCategorie] = useState(CATEGORIES_TICKETS[0]);
  const [formPriorite, setFormPriorite] = useState<PrioriteTicket>("normale");
  const [formCanal, setFormCanal] = useState<CanalTicket>("application");
  const [formEquipementId, setFormEquipementId] = useState("");

  // Modal Résolution / Intervention
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [newStatut, setNewStatut] = useState<StatutTicket>("en_cours");
  const [actionIntervention, setActionIntervention] = useState("");
  const [resultatIntervention, setResultatIntervention] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatut !== "tous") params.append("statut", filterStatut);
      if (filterPriorite !== "tous") params.append("priorite", filterPriorite);

      const [resTck, resEmp, resEq] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`),
        fetch("/api/employes"),
        fetch("/api/equipements"),
      ]);

      const jsonTck = await resTck.json();
      const jsonEmp = await resEmp.json();
      const jsonEq = await resEq.json();

      if (jsonTck.success) setTickets(jsonTck.data);
      if (jsonEmp.success) {
        setEmployes(jsonEmp.data);
        if (jsonEmp.data.length > 0 && !formDemandeurId) setFormDemandeurId(jsonEmp.data[0].id);
      }
      if (jsonEq.success) setEquipements(jsonEq.data);
    } catch {
      toast.error("Erreur de chargement des tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatut, filterPriorite]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDemandeurId || !formDescription.trim()) {
      toast.error("Veuillez sélectionner un demandeur et décrire le problème.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeur_id: formDemandeurId,
          description: formDescription,
          categorie: formCategorie,
          priorite: formPriorite,
          canal: formCanal,
          equipement_id: formEquipementId || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Demande d'assistance créée avec succès !");
        setIsModalOpen(false);
        setFormDescription("");
        setFormEquipementId("");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la création.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setIsResolving(true);
    try {
      const payload: { statut: StatutTicket; intervention?: { actions: string; resultat: string } } = {
        statut: newStatut,
      };

      if (actionIntervention.trim()) {
        payload.intervention = {
          actions: actionIntervention,
          resultat: resultatIntervention || "Traité par l'administrateur IT",
        };
      }

      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Ticket et rapport d'intervention mis à jour !");
        setActiveTicket(null);
        setActionIntervention("");
        setResultatIntervention("");
        loadData();
      } else {
        toast.error(json.message || "Erreur de mise à jour.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets d’assistance"
        description="Signalements des employés et suivi des interventions techniques."
        icon={LifeBuoy}
      >
          <Button
            variant="outline"
            size="default"
            onClick={loadData}
            className="h-10 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualiser
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer un ticket
          </Button>
      </PageHeader>

      {/* Barre de filtres */}
      <Card className="border-slate-800 bg-slate-900/80 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par numéro, demandeur, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="en_attente">En attente</option>
              <option value="resolu">Résolu</option>
              <option value="cloture">Clôturé</option>
            </select>

            <select
              value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
            >
              <option value="tous">Toutes priorités</option>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-950 text-slate-200 hover:text-white"
            >
              Filtrer
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des Tickets */}
      <Card className="border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0d1728] border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Demandeur & Service</th>
                <th className="py-3 px-4">Description du problème</th>
                <th className="py-3 px-4">Priorité</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-400 mb-2" />
                    Chargement des demandes d&apos;assistance...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    Aucun ticket trouvé selon les critères.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const statutInfo = STATUTS_TICKETS[t.statut] || { label: t.statut, badgeClass: "" };
                  const prioriteInfo = PRIORITES_TICKETS[t.priorite] || { label: t.priorite, badgeClass: "" };

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-teal-400 text-xs">
                          {formatNumeroTicket(t.numero)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateFr(t.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {t.demandeur_nom}
                        </div>
                        <div className="text-xs text-slate-400">
                          {t.service_nom || "Non assigné"}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-300 font-medium line-clamp-2">
                          {t.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                            {t.categorie}
                          </span>
                          {t.equipement_label && (
                            <span className="text-xs text-green-300 truncate max-w-[140px]">
                              {t.equipement_label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${prioriteInfo.badgeClass}`}>
                          {prioriteInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {CANAUX_TICKETS[t.canal] || t.canal}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${statutInfo.badgeClass}`}>
                          {statutInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setActiveTicket(t);
                            setNewStatut(t.statut);
                          }}
                          className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1 text-teal-400" />
                          Gérer
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création de Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Nouvelle Demande d&apos;Assistance
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Enregistrer un incident ou un besoin matériel
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

            <form onSubmit={handleCreateTicket}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                {/* Demandeur */}
                <div className="space-y-1">
                  <Label htmlFor="demandeur" className="text-slate-300">
                    Employé demandeur *
                  </Label>
                  <select
                    id="demandeur"
                    required
                    value={formDemandeurId}
                    onChange={(e) => setFormDemandeurId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    {employes.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom} ({emp.service_nom || "Sans service"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catégorie & Canal */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="cat" className="text-slate-300">
                      Catégorie *
                    </Label>
                    <select
                      id="cat"
                      value={formCategorie}
                      onChange={(e) => setFormCategorie(e.target.value)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                    >
                      {CATEGORIES_TICKETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="canal" className="text-slate-300">
                      Canal de réception
                    </Label>
                    <select
                      id="canal"
                      value={formCanal}
                      onChange={(e) => setFormCanal(e.target.value as CanalTicket)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                    >
                      <option value="application">Application Web</option>
                      <option value="telephone">Téléphone</option>
                      <option value="email">E-mail</option>
                      <option value="presentiel">Présentiel / Bureau IT</option>
                    </select>
                  </div>
                </div>

                {/* Priorité & Équipement */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="prio" className="text-slate-300">
                      Degré de priorité
                    </Label>
                    <select
                      id="prio"
                      value={formPriorite}
                      onChange={(e) => setFormPriorite(e.target.value as PrioriteTicket)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                    >
                      <option value="basse">Basse</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="critique">Critique</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eq" className="text-slate-300">
                      Équipement lié (optionnel)
                    </Label>
                    <select
                      id="eq"
                      value={formEquipementId}
                      onChange={(e) => setFormEquipementId(e.target.value)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                    >
                      <option value="">Aucun équipement spécifique</option>
                      {equipements.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.type} • {e.marque} ({e.numero_serie || "S/N inconnu"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label htmlFor="desc" className="text-slate-300">
                    Description détaillée du problème *
                  </Label>
                  <textarea
                    id="desc"
                    required
                    rows={3}
                    placeholder="Décrivez les symptômes, messages d'erreur et circonstances..."
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
                    "Enregistrer le ticket"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Traitement Ticket & Intervention */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-100 shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-teal-400" />
                  Traitement du Ticket {formatNumeroTicket(activeTicket.numero)}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Demandeur : {activeTicket.demandeur_nom} • {activeTicket.service_nom}
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleUpdateTicket}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Rappel du problème */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-xs">Problème signalé :</span>
                  <p className="text-slate-300 font-medium">{activeTicket.description}</p>
                </div>

                {/* Nouveau Statut */}
                <div className="space-y-1">
                  <Label htmlFor="statut" className="text-slate-300">
                    Statut du ticket
                  </Label>
                  <select
                    id="statut"
                    value={newStatut}
                    onChange={(e) => setNewStatut(e.target.value as StatutTicket)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="en_cours">En cours de traitement</option>
                    <option value="en_attente">En attente (pièces / prestataire)</option>
                    <option value="resolu">Résolu</option>
                    <option value="cloture">Clôturé définitivement</option>
                  </select>
                </div>

                {/* Rapport d'intervention */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Compte-rendu d&apos;intervention technique</span>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="actions" className="text-slate-400">
                      Actions réalisées
                    </Label>
                    <textarea
                      id="actions"
                      rows={3}
                      placeholder="Diagnostic effectué, composants nettoyés ou remplacés, tests..."
                      value={actionIntervention}
                      onChange={(e) => setActionIntervention(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="res" className="text-slate-400">
                      Résultat technique
                    </Label>
                    <Input
                      id="res"
                      placeholder="ex: Résolu avec succès, équipement rendu fonctionnel"
                      value={resultatIntervention}
                      onChange={(e) => setResultatIntervention(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTicket(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Fermer
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResolving}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer l'intervention"
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
