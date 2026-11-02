"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  LifeBuoy,
  Plus,
  LogOut,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  FileQuestion,
  ShieldCheck,
  Flame,
  Phone,
  Mail,
  Monitor,
  Printer,
  Smartphone,
  Server,
  ArrowRight,
  Headphones,
  Check,
  Tag,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Equipement, Ticket } from "@/types";
import {
  STATUTS_TICKETS,
  PRIORITES_TICKETS,
  CATEGORIES_TICKETS,
  formatNumeroTicket,
  formatCodeEquipement,
  formatDateFr,
} from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface EmployeSession {
  id: string;
  role: string;
  employe_id: string;
  nom: string;
}

export default function EspaceEmployePage() {
  const router = useRouter();
  const [session, setSession] = useState<EmployeSession | null>(null);
  const [employeData, setEmployeData] = useState<any>(null);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"equipements" | "tickets" | "support">("equipements");

  // Modal Nouveau Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formCategorie, setFormCategorie] = useState(CATEGORIES_TICKETS[0]);
  const [formEquipementId, setFormEquipementId] = useState("");
  const [formPriorite, setFormPriorite] = useState<"basse" | "normale" | "haute">("normale");

  const loadEmployeData = async (empId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employe/me?employe_id=${empId}`);
      const json = await res.json();
      if (json.success) {
        setEmployeData(json.data.employe);
        setEquipements(json.data.equipements);
        setTickets(json.data.tickets);
        if (json.data.equipements.length > 0 && !formEquipementId) {
          setFormEquipementId(json.data.equipements[0].id);
        }
      } else {
        toast.error("Impossible de charger votre espace collaborateur.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("touba_gaz_user") : null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setSession(parsed);
        const empId = parsed.employe_id || parsed.id;
        const rawId = empId?.startsWith("EMP-") ? empId : parsed.employe_id;
        loadEmployeData(rawId);
        return;
      } catch {
        // ignore
      }
    }

    toast.error("Veuillez vous connecter.");
    router.push("/");
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("touba_gaz_user");
    }
    document.cookie = "touba_gaz_session=; path=/; max-age=0";
    toast.success("Déconnexion réussie.");
    router.push("/");
  };

  const handleOpenTicketForEquipement = (eqId: string) => {
    setFormEquipementId(eqId);
    setFormCategorie("Matériel informatique");
    setIsModalOpen(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      toast.error("Veuillez décrire le problème rencontré.");
      return;
    }

    const empId = session?.employe_id || session?.id;
    if (!empId) {
      toast.error("Session invalide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeur_id: empId,
          description: formDescription,
          categorie: formCategorie,
          priorite: formPriorite,
          canal: "application",
          equipement_id: formEquipementId || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Votre demande d'assistance a été transmise aux techniciens IT !");
        setIsModalOpen(false);
        setFormDescription("");
        setActiveTab("tickets");
        loadEmployeData(empId);
      } else {
        toast.error(json.message || "Erreur lors de la création.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistiques rapides
  const ticketsEnCours = tickets.filter((t) => t.statut === "en_cours" || t.statut === "nouveau" || t.statut === "en_attente").length;
  const ticketsResolus = tickets.filter((t) => t.statut === "resolu" || t.statut === "cloture").length;

  const getEquipmentIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("portable") || t.includes("laptop")) return Laptop;
    if (t.includes("écran") || t.includes("moniteur") || t.includes("fixe")) return Monitor;
    if (t.includes("imprimante") || t.includes("scanner")) return Printer;
    if (t.includes("téléphone") || t.includes("mobile")) return Smartphone;
    return Server;
  };

  const initials = employeData ? `${employeData.prenom?.[0] || ""}${employeData.nom?.[0] || ""}`.toUpperCase() : "TG";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#17231B] flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Header Intranet Entreprise Touba Gaz */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-slate-900">TOUBA GAZ SA</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Portail Collaborateur
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Direction des Systèmes d'Information & Assistance IT</p>
          </div>
        </div>

        {/* Profil collaborateur & Déconnexion */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {employeData?.prenom} {employeData?.nom}
              </p>
              <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
                <Building2 className="h-3 w-3" />
                {employeData?.service_nom || "Touba Gaz SA"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 px-3 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 rounded-lg gap-1.5 transition-colors text-xs font-medium"
            title="Se déconnecter de votre espace"
          >
            <LogOut className="h-4 w-4 text-rose-600" />
            <span className="hidden sm:inline">Quitter</span>
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">

        {/* Bannière de Bienvenue */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Session active • {employeData?.service_nom || "Service interne"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Bienvenue, {employeData?.prenom || "Collaborateur"} !
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                Retrouvez l'inventaire de vos équipements de travail et déclarez vos demandes d'assistance informatique en direct à la DSI.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs gap-2 shrink-0 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Signaler un problème IT
            </Button>
          </div>

          {/* 3 KPIs intégrés */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[11px] font-medium">Matériels en dotation</p>
                <p className="text-lg font-bold text-slate-900">{equipements.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/50">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[11px] font-medium">Demandes en cours</p>
                <p className="text-lg font-bold text-amber-700">{ticketsEnCours}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[11px] font-medium">Demandes résolues</p>
                <p className="text-lg font-bold text-emerald-700">{ticketsResolus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de navigation par onglets épurés */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("equipements")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "equipements"
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Laptop className="h-4 w-4" />
            Mes Équipements
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {equipements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "tickets"
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            Mes Demandes d'Assistance
            {ticketsEnCours > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                {ticketsEnCours}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "support"
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Headphones className="h-4 w-4" />
            Support IT Touba Gaz
          </button>
        </div>

        {/* CONTENU DE L'ONGLET 1 : MES ÉQUIPEMENTS */}
        {activeTab === "equipements" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement de vos équipements...
              </div>
            ) : equipements.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                  <Laptop className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Aucun équipement personnel actuellement affecté</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Si un matériel informatique (ordinateur, écran, téléphone) vous a été remis récemment, l'administrateur IT doit valider son affectation dans le système pour qu'il apparaisse ici.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Demander une dotation de matériel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipements.map((eq: any) => {
                  const Icon = getEquipmentIcon(eq.type);

                  return (
                    <div
                      key={eq.id}
                      className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 transition-all duration-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 flex items-center justify-center">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-emerald-700 block">
                                {formatCodeEquipement(eq.code)}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {eq.type}
                              </span>
                            </div>
                          </div>

                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            En dotation
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {eq.marque} {eq.modele}
                          </h4>
                          {eq.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {eq.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Hash className="h-3 w-3 text-slate-400" />
                              N° de Série :
                            </span>
                            <span className="font-mono text-slate-800 font-semibold">
                              {eq.numero_serie || "Non renseigné"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              Attribué le :
                            </span>
                            <span className="text-slate-800 font-medium">
                              {formatDateFr(eq.affectation_date_debut)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTicketForEquipement(eq.id)}
                          className="w-full h-8 text-xs border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors gap-1.5 font-medium"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Signaler un souci sur ce matériel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENU DE L'ONGLET 2 : MES TICKETS */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Historique de vos signalements</h3>
                <p className="text-xs text-slate-500">Suivi des interventions techniques assurées par l'équipe informatique.</p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau signalement
              </Button>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement de vos tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                  <LifeBuoy className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Aucun incident ou demande signalé</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tout fonctionne correctement ? En cas de panne d'écran, problème réseau, mot de passe ou imprimante, créez un ticket en quelques secondes.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer mon premier ticket
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t: any) => {
                  const statutInfo = STATUTS_TICKETS[t.statut as keyof typeof STATUTS_TICKETS] || {
                    label: t.statut,
                    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  const prioriteInfo = PRIORITES_TICKETS[t.priorite as keyof typeof PRIORITES_TICKETS] || {
                    label: t.priorite,
                    badgeClass: "",
                  };

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {formatNumeroTicket(t.numero)}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {t.categorie}
                          </span>
                          {t.equipement_label && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                              • <Laptop className="h-3 w-3 text-slate-400" /> {t.equipement_label}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            • {formatDateFr(t.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${prioriteInfo.badgeClass}`}>
                            {prioriteInfo.label}
                          </span>
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statutInfo.badgeClass}`}>
                            {statutInfo.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {t.description}
                      </p>

                      {/* Rapport de l'intervention technique si résolu */}
                      {t.intervention_actions && (
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5 mt-2">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span>Intervention réalisée par le service informatique :</span>
                          </div>
                          <p className="text-slate-700 pl-5 leading-relaxed">
                            {t.intervention_actions}
                          </p>
                          {t.intervention_resultat && (
                            <p className="text-emerald-800 font-semibold pl-5 text-[11px]">
                              Résultat final : {t.intervention_resultat}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENU DE L'ONGLET 3 : SUPPORT IT TOUBA GAZ */}
        {activeTab === "support" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 flex items-center justify-center">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Permanence Informatique & DSI</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  L'équipe informatique Touba Gaz vous accompagne du lundi au vendredi pour la résolution de vos incidents matériels et applicatifs.
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Standard interne : <strong>Poste 102 / 105</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span>E-mail direct : <strong>support.it@toubagaz.sn</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Horaires : <strong>08h00 – 18h00 (Lun - Ven)</strong></span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Bonnes pratiques de sécurité</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Rappels essentiels pour la préservation du parc informatique Touba Gaz.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Ne communiquez jamais vos mots de passe de session par e-mail ou téléphone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Verrouillez systématiquement votre poste de travail lors de vos déplacements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Signalez tout comportement anormal ou lenteur suspecte via ce portail.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Modal Création Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-slate-200 bg-white text-slate-900 shadow-xl my-8 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-slate-100 bg-slate-50/70">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-emerald-600" />
                  Déclarer un problème informatique
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Un technicien DSI prendra en charge votre demande rapidement.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateTicket}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Choix de la catégorie */}
                <div className="space-y-1.5">
                  <Label htmlFor="cat" className="text-slate-700 font-semibold">
                    Type de demande *
                  </Label>
                  <select
                    id="cat"
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value)}
                    className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none shadow-xs"
                  >
                    {CATEGORIES_TICKETS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Équipement concerné */}
                <div className="space-y-1.5">
                  <Label htmlFor="eq" className="text-slate-700 font-semibold">
                    Équipement concerné
                  </Label>
                  <select
                    id="eq"
                    value={formEquipementId}
                    onChange={(e) => setFormEquipementId(e.target.value)}
                    className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none shadow-xs"
                  >
                    <option value="">Problème général / Non lié à un matériel précis</option>
                    {equipements.map((eq: any) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.type} — {eq.marque} {eq.modele} ({eq.numero_serie || "S/N inconnu"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Degré d'urgence */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-semibold block">
                    Degré d'urgence
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPriorite("basse")}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        formPriorite === "basse"
                          ? "bg-slate-100 text-slate-900 border-slate-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Basse
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriorite("normale")}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        formPriorite === "normale"
                          ? "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-300/50"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Normale
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriorite("haute")}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        formPriorite === "haute"
                          ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300/50"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Urgente
                    </button>
                  </div>
                </div>

                {/* Description détaillée */}
                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-slate-700 font-semibold">
                    Description du problème *
                  </Label>
                  <textarea
                    id="desc"
                    required
                    rows={4}
                    placeholder="Détaillez le comportement observé : que faisiez-vous ? Quels sont les messages affichés à l'écran ?"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs leading-relaxed"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-9 px-4 gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Transmission...
                    </>
                  ) : (
                    "Transmettre au support IT"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Footer Institutionnel Discret */}
      <footer className="border-t border-[#E2E8F0] bg-white px-4 py-4 text-center text-xs text-slate-500 mt-auto">
        © 2026 Touba Gaz SA · Direction des Systèmes d'Information · Portail Intranet d'Assistance
      </footer>
    </div>
  );
}
