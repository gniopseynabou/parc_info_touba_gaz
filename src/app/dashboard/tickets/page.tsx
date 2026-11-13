"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LifeBuoy,
  Plus,
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
  Sparkles,
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

  // Trouver le demandeur sélectionné pour connaître son service_id
  const selectedDemandeur = useMemo(() => {
    return employes.find((emp) => emp.id === formDemandeurId) || null;
  }, [employes, formDemandeurId]);

  // Filtrer les équipements liés en fonction de l'employé demandeur sélectionné
  // 1. Équipements personnels affectés directement à l'employé
  // 2. Équipements communs affectés au service de l'employé
  const filteredEquipements = useMemo(() => {
    if (!formDemandeurId) {
      return { personnels: [] as any[], deService: [] as any[], total: 0 };
    }

    const demandeurServiceId = selectedDemandeur?.service_id;

    const personnels: any[] = [];
    const deService: any[] = [];

    equipements.forEach((eq: any) => {
      if (eq.archive === 1 || eq.archive === true) return;

      if (eq.employe_id === formDemandeurId) {
        personnels.push(eq);
      } else if (demandeurServiceId && (eq.direct_service_id === demandeurServiceId || eq.service_id === demandeurServiceId)) {
        deService.push(eq);
      }
    });

    return {
      personnels,
      deService,
      total: personnels.length + deService.length,
    };
  }, [equipements, formDemandeurId, selectedDemandeur]);

  // Si l'équipement sélectionné ne fait plus partie des équipements filtrés du demandeur, on le réinitialise
  useEffect(() => {
    if (formEquipementId) {
      const allFilteredIds = [
        ...filteredEquipements.personnels.map((e: any) => e.id),
        ...filteredEquipements.deService.map((e: any) => e.id),
      ];
      if (!allFilteredIds.includes(formEquipementId)) {
        setFormEquipementId("");
      }
    }
  }, [formDemandeurId, filteredEquipements, formEquipementId]);

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
    if (!formDemandeurId) {
      toast.error("Veuillez sélectionner un employé demandeur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeur_id: formDemandeurId,
          description: formDescription.trim(),
          categorie: formCategorie,
          canal: formCanal,
          equipement_id: formEquipementId || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const msg = json.priorite_explication
          ? `Ticket créé avec succès (${json.priorite_explication})`
          : "Ticket créé avec succès.";
        toast.success(msg);
        setIsModalOpen(false);
        setFormDescription("");
        setFormEquipementId("");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la création du ticket.");
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
    setActionIntervention("");
    setResultatIntervention("");

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setIntDebut(formattedNow);
    setIntFin(formattedNow);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveTicket({ ...ticket, attachments: json.data.attachments || [] });
        if (json.data.intervention) {
          const intv = json.data.intervention;
          setActionIntervention(intv.actions || "");
          setResultatIntervention(intv.resultat || "");
          if (intv.date_debut) setIntDebut(intv.date_debut.slice(0, 16));
          if (intv.date_fin) setIntFin(intv.date_fin.slice(0, 16));
        }
      }
    } catch {
      // ignore
    }
  };

  const computeDuree = () => {
    if (!intDebut || !intFin) return null;
    const d1 = new Date(intDebut).getTime();
    const d2 = new Date(intFin).getTime();
    if (isNaN(d1) || isNaN(d2) || d2 <= d1) return null;
    const diffMinutes = Math.round((d2 - d1) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

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

  // Trouver l'employé sélectionné dans le formulaire d'ajout
  const selectedEmp = employes.find((e) => e.id === formDemandeurId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets & Demandes d'assistance"
        description="Gestion des signalements, prise en charge et traçabilité des interventions techniques."
        icon={LifeBuoy}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-xs font-semibold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nouveau ticket
        </Button>
      </PageHeader>

      {/* Barre de filtres unifiée */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par numéro, demandeur, catégorie, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
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
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            >
              <option value="tous">Toutes les priorités</option>
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>

          </div>
        </form>
      </Card>

      {/* Tableau des Tickets */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement des demandes d'assistance...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Aucun ticket trouvé.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const statutInfo = STATUTS_TICKETS[t.statut] || { label: t.statut, badgeClass: "" };
                  const prioriteInfo = PRIORITES_TICKETS[t.priorite] || { label: t.priorite, badgeClass: "" };

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          {formatNumeroTicket(t.numero)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDateFr(t.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {t.demandeur_nom}
                        </div>
                        <div className="text-xs text-slate-500">
                          {t.service_nom || "Non assigné"}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium line-clamp-2 text-xs">
                          {t.description}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {t.categorie}
                          </span>
                          {t.equipement_label && (
                            <span className="text-[11px] text-emerald-700 font-medium truncate max-w-[140px]">
                              {t.equipement_label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${prioriteInfo.badgeClass}`}
                            title={t.priorite_explication || `Priorité ${prioriteInfo.label}`}
                          >
                            {prioriteInfo.label}
                          </span>
                          {t.priorite_explication && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[160px]" title={t.priorite_explication}>
                              {t.priorite_explication}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
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
                          className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5"
                        >
                          <Wrench className="h-3.5 w-3.5 text-emerald-600" />
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

      {/* Modal Création de Ticket (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nouvelle Demande d'Assistance</h2>
                <p className="text-xs text-slate-500">
                  Enregistrer un incident (saisie directe ou au nom d'un employé).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Employé demandeur *</Label>
                <select
                  required
                  value={formDemandeurId}
                  onChange={(e) => setFormDemandeurId(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-600 shadow-xs"
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
                  <Label className="text-xs font-semibold text-slate-700">Catégorie *</Label>
                  <select
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-600 shadow-xs"
                  >
                    {CATEGORIES_TICKETS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Canal de réception</Label>
                  <select
                    value={formCanal}
                    onChange={(e) => setFormCanal(e.target.value as CanalTicket)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-600 shadow-xs"
                  >
                    <option value="application">Application Web</option>
                    <option value="telephone">Téléphone</option>
                    <option value="email">E-mail</option>
                    <option value="presentiel">Présentiel / Bureau IT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Équipement lié (optionnel)</Label>
                {!formDemandeurId ? (
                  <p className="text-xs text-slate-400 italic">Veuillez d'abord sélectionner un demandeur.</p>
                ) : filteredEquipements.total === 0 ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-800">
                    Aucun équipement personnel ou de service affecté à {selectedDemandeur ? `${selectedDemandeur.prenom} ${selectedDemandeur.nom}` : "cet employé"}. La demande sera enregistrée sans matériel spécifique.
                  </div>
                ) : (
                  <select
                    value={formEquipementId}
                    onChange={(e) => setFormEquipementId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-600 shadow-xs"
                  >
                    <option value="">Aucun équipement spécifique</option>
                    {filteredEquipements.personnels.length > 0 && (
                      <optgroup label={`Équipements personnels (${filteredEquipements.personnels.length})`}>
                        {filteredEquipements.personnels.map((e: any) => (
                          <option key={e.id} value={e.id}>
                            {e.type} • {e.marque} {e.modele} ({e.numero_serie || "S/N inconnu"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {filteredEquipements.deService.length > 0 && (
                      <optgroup label={`Équipements partagés du service ${selectedDemandeur?.service_nom || ""} (${filteredEquipements.deService.length})`}>
                        {filteredEquipements.deService.map((e: any) => (
                          <option key={e.id} value={e.id}>
                            [Service] {e.type} • {e.marque} {e.modele} ({e.numero_serie || "S/N inconnu"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Description détaillée du problème</Label>
                  <span className="text-[11px] text-slate-400 font-normal">Facultatif</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Circonstances, message d'erreur, urgence opérationnelle (optionnel)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                  Prise en charge Ticket {formatNumeroTicket(activeTicket.numero)}
                </h2>
                <p className="text-xs text-slate-500">
                  Demandeur : <strong>{activeTicket.demandeur_nom}</strong> ({activeTicket.service_nom || "Sans service"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="mt-4 space-y-4">
              {/* Rappel du problème */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Problème signalé :</span>
                  <span className="text-emerald-700">{activeTicket.categorie}</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {activeTicket.description}
                </p>
                {activeTicket.equipement_label && (
                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    Matériel concerné : {activeTicket.equipement_label}
                  </p>
                )}
                {activeTicket.priorite_explication && (
                  <p className="text-[11px] text-slate-500 italic flex items-center gap-1 mt-1">
                    <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{activeTicket.priorite_explication}</span>
                  </p>
                )}
              </div>

              {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Photos jointes</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {activeTicket.attachments.map((photo) => (
                      <a
                        key={photo.id}
                        href={`/api/tickets/${activeTicket.id}/attachments/${photo.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border border-slate-200 hover:border-emerald-400"
                      >
                        {/* The private route checks ticket access before serving each image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/tickets/${activeTicket.id}/attachments/${photo.id}`}
                          alt={photo.original_name}
                          className="h-28 w-full object-cover"
                        />
                        <span className="block truncate px-2 py-1 text-[10px] text-slate-600">{photo.original_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Statut du Ticket */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-700 font-semibold">
                  Statut du ticket *
                </Label>
                <select
                  value={newStatut}
                  onChange={(e) => setNewStatut(e.target.value as StatutTicket)}
                  className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus:border-emerald-600 font-semibold shadow-xs"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours de traitement</option>
                  <option value="en_attente">En attente (pièces / retour utilisateur)</option>
                  <option value="resolu">Résolu (intervention effectuée)</option>
                  <option value="cloture">Clôturé définitivement (validation service)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  {newStatut === "resolu" && "Note : Le ticket sera marqué comme techniquement résolu. La clôture administrative pourra être effectuée après confirmation."}
                  {newStatut === "cloture" && "Note : Clôture administrative définitive. Le ticket sera figé pour traçabilité."}
                </p>
              </div>

              {/* Section Intervention Unique */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Rapport d'intervention technique unique</span>
                  </div>
                  {computeDuree() && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Durée : {computeDuree()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Date et heure de début</Label>
                    <Input
                      type="datetime-local"
                      value={intDebut}
                      onChange={(e) => setIntDebut(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Date et heure de fin</Label>
                    <Input
                      type="datetime-local"
                      value={intFin}
                      onChange={(e) => setIntFin(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Actions techniques réalisées
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Démontage, nettoyage, test ping réseau, remplacement câble, réinstallation système..."
                    value={actionIntervention}
                    onChange={(e) => setActionIntervention(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Résultat de l'intervention
                  </Label>
                  <Input
                    placeholder="ex: Problème résolu avec succès, matériel opérationnel remis à l'employé"
                    value={resultatIntervention}
                    onChange={(e) => setResultatIntervention(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTicket(null)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isResolving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
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
