"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Headphones,
  Check,
  Hash,
  Sparkles,
  Info,
  ImageIcon,
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
import { PhotoAttachments } from "@/components/tickets/photo-attachments";

interface EmployeStats {
  totalTickets: number;
  ticketsEnCours: number;
  ticketsResolus: number;
  totalEquipementsPerso: number;
  totalEquipementsService: number;
}

export default function EspaceEmployePage() {
  const router = useRouter();
  const [employeData, setEmployeData] = useState<any>(null);
  const [equipements, setEquipements] = useState<any[]>([]);
  const [equipementsPerso, setEquipementsPerso] = useState<any[]>([]);
  const [equipementsService, setEquipementsService] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<EmployeStats>({
    totalTickets: 0,
    ticketsEnCours: 0,
    ticketsResolus: 0,
    totalEquipementsPerso: 0,
    totalEquipementsService: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"equipements" | "tickets" | "support">("equipements");

  // Modal Nouveau Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formCategorie, setFormCategorie] = useState(CATEGORIES_TICKETS[0]);
  const [formEquipementId, setFormEquipementId] = useState("");
  const [formPhotos, setFormPhotos] = useState<File[]>([]);

  // Chargement des données sécurisé côté serveur (basé sur la session cookie)
  const loadEmployeData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employe/me");
      if (res.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        router.push("/");
        return;
      }
      if (res.status === 403) {
        toast.error("Accès non autorisé à cet espace.");
        router.push("/");
        return;
      }
      if (res.status === 404) {
        toast.error("Aucun profil employé actif rattaché à votre compte.");
        setIsLoading(false);
        return;
      }

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setEmployeData(json.data.employe);
        const pers = json.data.equipements_personnels || [];
        const srv = json.data.equipements_service || [];
        setEquipementsPerso(pers);
        setEquipementsService(srv);
        setEquipements(json.data.equipements || [...pers, ...srv]);
        setTickets(json.data.tickets || []);
        if (json.data.stats) {
          setStats(json.data.stats);
        } else {
          const tList: Ticket[] = json.data.tickets || [];
          setStats({
            totalTickets: tList.length,
            ticketsEnCours: tList.filter((t) => ["nouveau", "en_cours", "en_attente"].includes(t.statut)).length,
            ticketsResolus: tList.filter((t) => ["resolu", "cloture"].includes(t.statut)).length,
            totalEquipementsPerso: pers.length,
            totalEquipementsService: srv.length,
          });
        }
      } else {
        toast.error(json.message || "Impossible de charger votre espace collaborateur.");
      }
    } catch (err) {
      console.error("Erreur chargement espace collaborateur:", err);
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("touba_gaz_user");
    }
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

    setIsSubmitting(true);
    try {
      // Création standard multipart/json
      const payload = {
        description: formDescription.trim(),
        categorie: formCategorie,
        canal: "application",
        equipement_id: formEquipementId || null,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const explicationMsg = json.priorite_explication
          ? ` (Priorité ${json.priorite} : ${json.priorite_explication})`
          : "";
        toast.success(`Votre demande d'assistance a été transmise à l'équipe IT !${explicationMsg}`);
        setIsModalOpen(false);
        setFormDescription("");
        setFormPhotos([]);
        setFormEquipementId("");
        setActiveTab("tickets");
        loadEmployeData();
      } else {
        toast.error(json.message || "Erreur lors de la création de la demande.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEquipmentIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("portable") || t.includes("laptop")) return Laptop;
    if (t.includes("écran") || t.includes("moniteur") || t.includes("fixe")) return Monitor;
    if (t.includes("imprimante") || t.includes("scanner")) return Printer;
    if (t.includes("téléphone") || t.includes("mobile")) return Smartphone;
    return Server;
  };

  // Calcul dynamique des initiales à partir du prénom et du nom
  const initials = useMemo(() => {
    if (!employeData) return "TG";
    const p = (employeData.prenom || "").trim().split(" ")[0]?.[0] || "";
    const n = (employeData.nom || "").trim().split(" ")[0]?.[0] || "";
    const res = `${p}${n}`.toUpperCase();
    return res || "TG";
  }, [employeData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#17231B] flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Barre supérieure adaptée mobile / tablette / desktop */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-slate-900 truncate">TOUBA GAZ</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                Espace Collaborateur
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">Gestion du parc informatique & assistance IT</p>
          </div>
        </div>

        {/* Profil collaborateur & Déconnexion (pas de cloche de notifications pour les collaborateurs) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 shrink-0 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-200 shadow-2xs"
              title={`${employeData?.prenom || ""} ${employeData?.nom || ""}`}
            >
              {initials}
            </div>
            <div className="hidden md:block text-left">
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
            className="h-9 px-3 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 rounded-lg gap-1.5 transition-colors text-xs font-medium cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4 text-rose-600" />
            <span className="hidden sm:inline">Quitter</span>
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Bannière de Bienvenue */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                {employeData?.service_nom || "Touba Gaz SA"}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                Bienvenue, {employeData?.prenom || "Collaborateur"} !
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                Retrouvez l'inventaire de vos équipements de travail et déclarez vos demandes d'assistance informatique en direct à la DSI.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs gap-2 shrink-0 rounded-xl cursor-pointer w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Signaler un problème IT
            </Button>
          </div>

          {/* 4 Cartes KPIs (Mes demandes, En cours, Résolues, Matériels affectés) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100">
            {/* KPI 1 : Mes demandes */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-200/60 shrink-0">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[11px] font-medium truncate">Mes demandes</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">{stats.totalTickets}</p>
              </div>
            </div>

            {/* KPI 2 : Demandes en cours */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/60 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[11px] font-medium truncate">Demandes en cours</p>
                <p className="text-lg sm:text-xl font-bold text-amber-700 tabular-nums">{stats.ticketsEnCours}</p>
              </div>
            </div>

            {/* KPI 3 : Demandes résolues */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[11px] font-medium truncate">Demandes résolues</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">{stats.ticketsResolus}</p>
              </div>
            </div>

            {/* KPI 4 : Mes équipements affectés */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60 shrink-0">
                <Laptop className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[11px] font-medium truncate">Mes équipements</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">{stats.totalEquipementsPerso}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de navigation par onglets épurés et scrollable sur mobile */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("equipements")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "equipements"
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Laptop className="h-4 w-4" />
            Mes Équipements
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {equipementsPerso.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "tickets"
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            Mes Demandes d'Assistance
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer shrink-0 ${
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
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-16 text-center text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement de vos équipements...
              </div>
            ) : equipementsPerso.length === 0 && equipementsService.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                  <Laptop className="h-7 w-7" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Aucun équipement personnel actuellement affecté</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Si un matériel informatique (ordinateur portable, unité centrale, écran, téléphone) vous a été attribué, il apparaîtra ici dès validation par la DSI.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Déclarer une demande de dotation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Équipements personnels */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-emerald-600" />
                      Équipements personnels en dotation ({equipementsPerso.length})
                    </h2>
                  </div>
                  {equipementsPerso.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-slate-200">
                      Aucun équipement individuel direct actif. Vous avez accès aux équipements partagés de votre service ci-dessous.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {equipementsPerso.map((eq: any) => {
                        const Icon = getEquipmentIcon(eq.type);
                        return (
                          <div
                            key={eq.id}
                            className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 transition-all duration-200 shadow-xs flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {/* Photo si disponible */}
                              {eq.photo && (
                                <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={eq.photo}
                                    alt={`${eq.marque || ""} ${eq.modele || ""}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 flex items-center justify-center shrink-0">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-mono text-xs font-bold text-emerald-700 block truncate">
                                      {formatCodeEquipement(eq.code)}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium truncate block">
                                      {eq.type}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  Personnel
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {eq.marque} {eq.modele}
                                </h3>
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
                                  <span className="font-mono text-slate-800 font-semibold truncate max-w-[140px]">
                                    {eq.numero_serie || "Non renseigné"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    Affecté le :
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
                                className="w-full h-8 text-xs border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors gap-1.5 font-medium cursor-pointer"
                              >
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                Signaler un problème sur ce matériel
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Équipements partagés du service */}
                {equipementsService.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Matériels communs du service {employeData?.service_nom || ""} ({equipementsService.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {equipementsService.map((eq: any) => {
                        const Icon = getEquipmentIcon(eq.type);
                        return (
                          <div
                            key={eq.id}
                            className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 transition-all duration-200 shadow-xs flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {eq.photo && (
                                <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={eq.photo}
                                    alt={`${eq.marque || ""} ${eq.modele || ""}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200/50 flex items-center justify-center shrink-0">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-mono text-xs font-bold text-blue-700 block truncate">
                                      {formatCodeEquipement(eq.code)}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium truncate block">
                                      {eq.type}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  Partagé
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                  {eq.marque} {eq.modele}
                                </h3>
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
                                  <span className="font-mono text-slate-800 font-semibold truncate max-w-[140px]">
                                    {eq.numero_serie || "Non renseigné"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3 text-slate-400" />
                                    Service :
                                  </span>
                                  <span className="text-slate-800 font-medium truncate max-w-[140px]">
                                    {employeData?.service_nom || "Service commun"}
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
                                className="w-full h-8 text-xs border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-blue-300 hover:bg-blue-50/30 transition-colors gap-1.5 font-medium cursor-pointer"
                              >
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                Signaler un dysfonctionnement
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONTENU DE L'ONGLET 2 : MES TICKETS */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Historique de vos signalements</h2>
                <p className="text-xs text-slate-500">Suivi des interventions techniques assurées par l'équipe informatique.</p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouveau signalement
              </Button>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement de vos demandes...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                  <LifeBuoy className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Aucun signalement enregistré</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  En cas de panne matérielle, problème réseau, incident applicatif ou messagerie, déclarez un ticket en quelques instants.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold cursor-pointer"
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
                    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
                  };

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            #{formatNumeroTicket(t.numero)}
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
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${prioriteInfo.badgeClass}`}
                            title={t.priorite_explication || `Priorité ${prioriteInfo.label}`}
                          >
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

                      {t.attachments && t.attachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                          {t.attachments.map((photo: { id: string; original_name: string }) => (
                            <a
                              key={photo.id}
                              href={`/api/tickets/${t.id}/attachments/${photo.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 group hover:border-emerald-300 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/tickets/${t.id}/attachments/${photo.id}`}
                                alt={photo.original_name}
                                className="h-24 w-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {t.priorite_explication && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 italic">
                          <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{t.priorite_explication}</span>
                        </p>
                      )}

                      {/* Rapport de l'intervention technique si existante */}
                      {t.intervention_actions && (
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5 mt-2">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span>Intervention technique réalisée par l'équipe IT :</span>
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
                <h3 className="text-base font-bold text-slate-900">Support Informatique Touba Gaz</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  L'équipe informatique Touba Gaz vous accompagne du lundi au vendredi pour la résolution de vos incidents matériels et applicatifs.
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Standard interne : <strong>Poste 102 / 105</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>E-mail direct : <strong>support.it@toubagaz.sn</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Horaires : <strong>08h00 – 18h00 (Lun - Ven)</strong></span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bonnes pratiques de sécurité</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Règles essentielles pour la préservation du parc informatique et des données de Touba Gaz.
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

      {/* Modal Création Ticket Collaborateur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <Card className="w-full max-w-lg border-slate-200 bg-white text-slate-900 shadow-xl my-8 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto">
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Information employé connecté */}
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold truncate">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Demandeur : {employeData?.prenom} {employeData?.nom}</span>
                  </div>
                  <span className="text-emerald-700 text-[11px] font-medium shrink-0 ml-2">
                    {employeData?.service_nom || "Touba Gaz"}
                  </span>
                </div>

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

                {/* Équipement concerné (propose UNIQUEMENT ses équipements affectés) */}
                <div className="space-y-1.5">
                  <Label htmlFor="eq" className="text-slate-700 font-semibold">
                    Équipement concerné
                  </Label>
                  {equipementsPerso.length === 0 && equipementsService.length === 0 ? (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <Info className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Aucun matériel actuellement rattaché à votre compte. Votre demande sera enregistrée comme demande générale.</span>
                    </div>
                  ) : (
                    <select
                      id="eq"
                      value={formEquipementId}
                      onChange={(e) => setFormEquipementId(e.target.value)}
                      className="w-full h-10 rounded-xl bg-white border border-slate-200 px-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 outline-none shadow-xs"
                    >
                      <option value="">Problème général / Non lié à un matériel précis</option>
                      {equipementsPerso.length > 0 && (
                        <optgroup label="Mes équipements personnels">
                          {equipementsPerso.map((eq: any) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.type} — {eq.marque} {eq.modele} ({eq.numero_serie || "S/N inconnu"})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {equipementsService.length > 0 && (
                        <optgroup label={`Équipements communs de votre service (${employeData?.service_nom || ""})`}>
                          {equipementsService.map((eq: any) => (
                            <option key={eq.id} value={eq.id}>
                              [Partagé] {eq.type} — {eq.marque} {eq.modele} ({eq.numero_serie || "S/N inconnu"})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>

                {/* Priorité calculée automatiquement */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs">Priorité déterminée automatiquement</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Le degré d'urgence (Basse, Normale, Haute, Critique) est calculé par le système selon la nature de la panne et la criticité du matériel.
                    </span>
                  </div>
                </div>

                {/* Description détaillée */}
                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-slate-700 font-semibold">
                    Description du problème rencontré *
                  </Label>
                  <textarea
                    id="desc"
                    required
                    rows={4}
                    placeholder="Précisez les circonstances de la panne, les messages d'erreur affichés et le niveau d'impact sur votre travail..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                        Transmission...
                      </>
                    ) : (
                      "Envoyer le signalement"
                    )}
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
