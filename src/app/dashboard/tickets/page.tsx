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
  Clock,
  Archive,
  PhoneCall,
  Mail,
  UserCheck,
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

  // Modal Nouveau Ticket (Enregistrement employé ou par IT au nom d'un employé)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDemandeurId, setFormDemandeurId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategorie, setFormCategorie] = useState(CATEGORIES_TICKETS[0]);
  const [formPriorite, setFormPriorite] = useState<PrioriteTicket>("normale");
  const [formCanal, setFormCanal] = useState<CanalTicket>("application");
  const [formEquipementId, setFormEquipementId] = useState("");

  // Modal Traitement Ticket & Intervention unique
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [newStatut, setNewStatut] = useState<StatutTicket>("en_cours");
  const [intDebut, setIntDebut] = useState("");
  const [intFin, setIntFin] = useState("");
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
        toast.success("Demande d'assistance enregistrée avec succès !");
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

  const openTicketModal = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setNewStatut(ticket.statut);

    // Initialisation des dates d'intervention (actuelles ou existantes)
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    // Charger les détails du ticket pour récupérer l'intervention rattachée
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      const json = await res.json();
      if (res.ok && json.success && json.data.intervention_actions) {
        const d = json.data;
        setActionIntervention(d.intervention_actions || "");
        setResultatIntervention(d.intervention_resultat || "");
        setIntDebut(d.intervention_debut ? d.intervention_debut.slice(0, 16).replace(" ", "T") : nowLocal);
        setIntFin(d.intervention_fin ? d.intervention_fin.slice(0, 16).replace(" ", "T") : nowLocal);
      } else {
        setActionIntervention("");
        setResultatIntervention("");
        setIntDebut(nowLocal);
        setIntFin(nowLocal);
      }
    } catch {
      setActionIntervention("");
      setResultatIntervention("");
      setIntDebut(nowLocal);
      setIntFin(nowLocal);
    }
  };

  // Calcul de la durée estimée
  const computeDuree = () => {
    if (!intDebut || !intFin) return null;
    const diffMs = new Date(intFin).getTime() - new Date(intDebut).getTime();
    if (diffMs < 0) return "Date de fin antérieure au début !";
    const minutes = Math.floor(diffMs / (1000 * 60));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} minute${m > 1 ? "s" : ""}`;
    return `${h} h ${m > 0 ? `${m} min` : ""}`;
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    if (actionIntervention.trim()) {
      if (intDebut && intFin && new Date(intFin).getTime() < new Date(intDebut).getTime()) {
        toast.error("La date et heure de fin ne peuvent pas être antérieures au début.");
        return;
      }
    }

    setIsResolving(true);
    try {
      const payload: {
        statut: StatutTicket;
        intervention?: {
          debut: string;
          fin: string;
          actions: string;
          resultat: string;
        };
      } = {
        statut: newStatut,
      };

      if (actionIntervention.trim()) {
        payload.intervention = {
          debut: intDebut ? intDebut.replace("T", " ") + ":00" : new Date().toISOString().slice(0, 19).replace("T", " "),
          fin: intFin ? intFin.replace("T", " ") + ":00" : new Date().toISOString().slice(0, 19).replace("T", " "),
          actions: actionIntervention.trim(),
          resultat: resultatIntervention.trim() || "Traité par le service informatique",
        };
      }

      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          newStatut === "cloture"
            ? "Ticket clôturé définitivement."
            : newStatut === "resolu"
            ? "Ticket marqué comme résolu."
            : "Ticket et intervention actualisés !"
        );
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
        title="Tickets & Demandes d'assistance"
        description="Gestion des signalements, prise en charge et traçabilité des interventions techniques."
        icon={LifeBuoy}
      >
        <Button
          variant="outline"
          size="default"
          onClick={loadData}
          className="h-10 border-slate-700 bg-[#0b1220] text-slate-200 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-green-400" : ""}`} />
          Actualiser
        </Button>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau ticket
        </Button>
      </PageHeader>

      {/* Règle métier rappel */}
      <div className="p-3.5 rounded-xl bg-green-950/20 border border-green-800/40 text-xs text-green-300 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span>
            <strong>Règle de gestion (RG07 / CT08) :</strong> Un ticket est rattaché à une seule intervention au maximum. La résolution technique est formellement distinguée de la clôture administrative (RG09).
          </span>
        </span>
      </div>

      {/* Barre de filtres */}
      <Card className="border-slate-800 bg-[#111c30] p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par numéro, demandeur, catégorie, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#0b1220] border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-green-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-xs text-white outline-none focus:border-green-500"
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
              className="h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-xs text-white outline-none focus:border-green-500"
            >
              <option value="tous">Toutes les priorités</option>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-slate-700 bg-[#0b1220] text-slate-200 hover:text-white"
            >
              Filtrer
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des Tickets */}
      <Card className="border-slate-800 bg-[#111c30] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0b1220] border-b border-slate-800 text-slate-400 font-medium text-xs">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Demandeur & Service</th>
                <th className="py-3 px-4">Problème signalé</th>
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
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-500 mb-2" />
                    Chargement des demandes d'assistance...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    Aucun ticket trouvé.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const statutInfo = STATUTS_TICKETS[t.statut] || { label: t.statut, badgeClass: "" };
                  const prioriteInfo = PRIORITES_TICKETS[t.priorite] || { label: t.priorite, badgeClass: "" };

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-green-400 text-xs">
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
                        <div className="text-slate-200 font-medium line-clamp-2 text-xs">
                          {t.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-400 bg-[#0b1220] px-1.5 py-0.5 rounded border border-slate-800">
                            {t.categorie}
                          </span>
                          {t.equipement_label && (
                            <span className="text-[11px] text-green-300 truncate max-w-[140px]">
                              {t.equipement_label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${prioriteInfo.badgeClass}`}>
                          {prioriteInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {CANAUX_TICKETS[t.canal] || t.canal}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statutInfo.badgeClass}`}>
                          {statutInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openTicketModal(t)}
                          className="text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
                        >
                          <Wrench className="h-3.5 w-3.5 text-green-400" />
                          Traiter / Intervenir
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

      {/* Modal Création de Ticket (par l'Admin pour lui-même ou au nom d'un employé) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111c30] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Nouvelle Demande d'Assistance</h2>
                <p className="text-xs text-slate-400">
                  Enregistrer un incident (saisie directe ou au nom d'un employé).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Employé demandeur *</Label>
                <select
                  required
                  value={formDemandeurId}
                  onChange={(e) => setFormDemandeurId(e.target.value)}
                  className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                >
                  {employes.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom} ({emp.service_nom || "Sans service"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Catégorie *</Label>
                  <select
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value)}
                    className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    {CATEGORIES_TICKETS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Canal de réception</Label>
                  <select
                    value={formCanal}
                    onChange={(e) => setFormCanal(e.target.value as CanalTicket)}
                    className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    <option value="application">Application Web</option>
                    <option value="telephone">Téléphone</option>
                    <option value="email">E-mail</option>
                    <option value="presentiel">Présentiel / Bureau IT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Priorité</Label>
                  <select
                    value={formPriorite}
                    onChange={(e) => setFormPriorite(e.target.value as PrioriteTicket)}
                    className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">Équipement lié (optionnel)</Label>
                  <select
                    value={formEquipementId}
                    onChange={(e) => setFormEquipementId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500"
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

              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Description détaillée du problème *</Label>
                <textarea
                  required
                  rows={3}
                  placeholder="Circonstances, message d'erreur, urgence opérationnelle..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1220] border border-slate-700 p-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-green-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
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
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  {isSubmitting ? "Enregistrement..." : "Créer le ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Traitement Ticket & Intervention Unique */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#111c30] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-green-400" />
                  Traitement du Ticket {formatNumeroTicket(activeTicket.numero)}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Demandeur : {activeTicket.demandeur_nom} · {activeTicket.service_nom || "Service inconnu"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="mt-4 space-y-4">
              {/* Résumé du problème */}
              <div className="p-3.5 rounded-xl bg-[#0b1220] border border-slate-800 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Problème déclaré :
                </span>
                <p className="text-sm text-slate-200">{activeTicket.description}</p>
                {activeTicket.equipement_label && (
                  <p className="text-xs text-green-400 mt-1">
                    Équipement concerné : {activeTicket.equipement_label}
                  </p>
                )}
              </div>

              {/* Statut du Ticket */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-medium">
                  Statut du ticket *
                </Label>
                <select
                  value={newStatut}
                  onChange={(e) => setNewStatut(e.target.value as StatutTicket)}
                  className="w-full h-10 rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white focus:border-green-500 font-medium"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours de traitement</option>
                  <option value="en_attente">En attente (pièces / retour utilisateur)</option>
                  <option value="resolu">Résolu (intervention effectuée)</option>
                  <option value="cloture">Clôturé définitivement (validation service)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {newStatut === "resolu" && "Note : Le ticket sera marqué comme techniquement résolu. La clôture administrative pourra être effectuée après confirmation."}
                  {newStatut === "cloture" && "Note : Clôture administrative définitive. Le ticket sera figé pour traçabilité."}
                </p>
              </div>

              {/* Section Intervention Unique */}
              <div className="p-4 rounded-xl bg-[#0b1220] border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>Rapport d'intervention technique unique</span>
                  </div>
                  {computeDuree() && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Durée : {computeDuree()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Date et heure de début</Label>
                    <Input
                      type="datetime-local"
                      value={intDebut}
                      onChange={(e) => setIntDebut(e.target.value)}
                      className="bg-[#111c30] border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Date et heure de fin</Label>
                    <Input
                      type="datetime-local"
                      value={intFin}
                      onChange={(e) => setIntFin(e.target.value)}
                      className="bg-[#111c30] border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">
                    Actions techniques réalisées
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Démontage, nettoyage, test ping réseau, remplacement câble, réinstallation système..."
                    value={actionIntervention}
                    onChange={(e) => setActionIntervention(e.target.value)}
                    className="w-full rounded-lg bg-[#111c30] border border-slate-700 p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-300">
                    Résultat de l'intervention
                  </Label>
                  <Input
                    placeholder="ex: Problème résolu avec succès, matériel opérationnel remis à l'employé"
                    value={resultatIntervention}
                    onChange={(e) => setResultatIntervention(e.target.value)}
                    className="bg-[#111c30] border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTicket(null)}
                  className="border-slate-700 text-slate-300"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isResolving}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer le traitement"
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
