"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Loader2,
  X,
  FileQuestion,
  Shield,
  KeyRound,
  UserCheck,
  Edit2,
  UserX,
  Laptop,
  Eye,
  Share2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Employe, Service } from "@/types";
import { formatCodeEquipement, formatDateFr, ETATS_EQUIPEMENTS } from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface EmployeWithRole extends Employe {
  user_role?: "admin" | "employe";
  user_email?: string;
  user_actif?: number;
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState<EmployeWithRole[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState<string>("tous");

  // Modal Ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelephone, setFormTelephone] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formCreerCompte, setFormCreerCompte] = useState(true);
  const [formRole, setFormRole] = useState<"employe" | "admin">("employe");
  const [formPassword, setFormPassword] = useState("ToubaGaz@2026");

  // Modal Édition
  const [editingEmp, setEditingEmp] = useState<EmployeWithRole | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editRole, setEditRole] = useState<"employe" | "admin">("employe");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  // Modal Détail Équipements & Fiche Collaborateur (Item 5)
  const [detailEmploye, setDetailEmploye] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterService !== "tous") params.append("service_id", filterService);

      const [resEmp, resSrv] = await Promise.all([
        fetch(`/api/employes?${params.toString()}`),
        fetch("/api/services"),
      ]);

      const jsonEmp = await resEmp.json();
      const jsonSrv = await resSrv.json();

      if (jsonEmp.success) setEmployes(jsonEmp.data);
      if (jsonSrv.success) {
        setServices(jsonSrv.data);
        if (jsonSrv.data.length > 0 && !formServiceId) setFormServiceId(jsonSrv.data[0].id);
      }
    } catch {
      toast.error("Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterService]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openEmployeDetail = async (emp: EmployeWithRole) => {
    setIsLoadingDetail(true);
    setDetailEmploye(null);
    try {
      const res = await fetch(`/api/employe/me?employe_id=${emp.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setDetailEmploye(json.data);
      } else {
        toast.error("Impossible de charger les équipements de cet employé.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || !formPrenom.trim()) {
      toast.error("Le nom et le prénom sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/employes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formNom,
          prenom: formPrenom,
          email: formEmail,
          telephone: formTelephone,
          service_id: formServiceId || null,
          creer_compte: formCreerCompte,
          role: formRole,
          password: formPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          json.userCreated
            ? `Employé ${formPrenom} ${formNom} créé avec son compte portail !`
            : `Employé ${formPrenom} ${formNom} enregistré avec succès.`
        );
        setIsModalOpen(false);
        setFormNom("");
        setFormPrenom("");
        setFormEmail("");
        setFormTelephone("");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la création.");
      }
    } catch {
      toast.error("Erreur serveur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: EmployeWithRole) => {
    setEditingEmp(emp);
    setEditNom(emp.nom);
    setEditPrenom(emp.prenom);
    setEditEmail(emp.email || "");
    setEditTelephone(emp.telephone || "");
    setEditServiceId(emp.service_id || (services.length > 0 ? services[0].id : ""));
    setEditRole(emp.user_role || "employe");
    setEditNewPassword("");
  };

  const handleUpdateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    if (!editNom.trim() || !editPrenom.trim()) {
      toast.error("Le nom et le prénom sont obligatoires.");
      return;
    }

    setIsEditingSubmitting(true);
    try {
      const res = await fetch(`/api/employes/${editingEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editNom,
          prenom: editPrenom,
          email: editEmail,
          telephone: editTelephone,
          service_id: editServiceId || null,
          role: editRole,
          password: editNewPassword || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Informations de l'employé mises à jour !");
        setEditingEmp(null);
        loadData();
      } else {
        toast.error(json.message || "Erreur de mise à jour.");
      }
    } catch {
      toast.error("Erreur serveur lors de la modification.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleDeactivate = async (emp: EmployeWithRole) => {
    const confirmation = window.confirm(
      `Êtes-vous certain de vouloir désactiver l'employé ${emp.prenom} ${emp.nom} ? Cette action suspend également son compte d'accès.`
    );
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/employes/${emp.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || "Employé désactivé.");
        loadData();
      } else {
        toast.error(json.message || "Impossible de désactiver cet employé.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <PageHeader
        title="Répertoire des employés"
        description="Personnel, services de rattachement, rôles et dotations du matériel Touba Gaz."
        icon={Users}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un employé
        </Button>
      </PageHeader>

      {/* Barre de filtres unifiée */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, prénom, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-medium">
              <Building2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Service :</span>
            </div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-emerald-600 shadow-xs"
            >
              <option value="tous">Tous les services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>

            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Filtrer
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={loadData}
              className="text-slate-500 hover:text-slate-900"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des employés */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Employé</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">E-mail professionnel</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4 text-center">Rôle & Accès</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement des employés...
                  </td>
                </tr>
              ) : employes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : (
                employes.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {emp.prenom} {emp.nom}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: {emp.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                        <Building2 className="h-3 w-3 text-emerald-600" />
                        {emp.service_nom || "Non rattaché"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {emp.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{emp.email}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {emp.telephone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{emp.telephone}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {emp.user_role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          <Shield className="h-3 w-3" />
                          Admin IT
                        </span>
                      ) : emp.user_id ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
                          <UserCheck className="h-3 w-3" />
                          Collaborateur
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                          Sans accès portail
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEmployeDetail(emp)}
                          className="h-8 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 text-xs"
                          title="Consulter les équipements individuels et communs"
                        >
                          <Laptop className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Dotation</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(emp)}
                          className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Modifier les coordonnées et accès"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(emp)}
                          className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Désactiver cet employé"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Détail Collaborateur & Équipements rattachés (Item 5) */}
      {(isLoadingDetail || detailEmploye) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl my-8 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-emerald-600" />
                  Fiche de dotation : {detailEmploye?.employe?.prenom} {detailEmploye?.employe?.nom}
                </h2>
                <p className="text-xs text-slate-500">
                  {detailEmploye?.employe?.service_nom || "Sans rattachement direct"} · Réf : {detailEmploye?.employe?.id}
                </p>
              </div>
              <button
                onClick={() => setDetailEmploye(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetail || !detailEmploye ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                Chargement des équipements...
              </div>
            ) : (
              <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                {/* 1. Équipements individuels */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>1. Équipements individuels en dotation ({detailEmploye.equipements_personnels?.length || 0})</span>
                  </h3>
                  {(!detailEmploye.equipements_personnels || detailEmploye.equipements_personnels.length === 0) ? (
                    <p className="text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                      Aucun matériel individuel directement affecté à cet employé.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {detailEmploye.equipements_personnels.map((eq: any) => {
                        const st = ETATS_EQUIPEMENTS[eq.etat as keyof typeof ETATS_EQUIPEMENTS] || { label: eq.etat, badgeClass: "" };
                        return (
                          <div key={eq.id} className="p-3 bg-white flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-700">
                                  {formatCodeEquipement(eq.code)}
                                </span>
                                <span className="font-semibold text-slate-900">{eq.type}</span>
                                <span className="text-slate-500">· {eq.marque} {eq.modele}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                S/N: {eq.numero_serie || "Non renseigné"} · Affecté le {formatDateFr(eq.affectation_date_debut)}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Équipements communs du service */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>2. Équipements partagés du service {detailEmploye.employe?.service_nom || ""} ({detailEmploye.equipements_service?.length || 0})</span>
                  </h3>
                  {(!detailEmploye.equipements_service || detailEmploye.equipements_service.length === 0) ? (
                    <p className="text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                      Aucun matériel partagé affecté au service de cet employé.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {detailEmploye.equipements_service.map((eq: any) => {
                        const st = ETATS_EQUIPEMENTS[eq.etat as keyof typeof ETATS_EQUIPEMENTS] || { label: eq.etat, badgeClass: "" };
                        return (
                          <div key={eq.id} className="p-3 bg-white flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-700">
                                  {formatCodeEquipement(eq.code)}
                                </span>
                                <span className="font-semibold text-slate-900">{eq.type}</span>
                                <span className="text-slate-500">· {eq.marque} {eq.modele}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                [Partagé Service] S/N: {eq.numero_serie || "Non renseigné"}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link href={`/dashboard/affectations`}>
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 gap-1.5 text-xs">
                      <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                      Attribuer un nouveau matériel
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => setDetailEmploye(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION EMPLOYÉ */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Modifier l'employé
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {editingEmp.prenom} {editingEmp.nom} (Réf : {editingEmp.id})
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEmp(null)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleUpdateEmploye}>
              <CardContent className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Prénom *</Label>
                    <Input
                      required
                      value={editPrenom}
                      onChange={(e) => setEditPrenom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Nom *</Label>
                    <Input
                      required
                      value={editNom}
                      onChange={(e) => setEditNom(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Service de rattachement</Label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">E-mail professionnel</Label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Téléphone pro</Label>
                    <Input
                      value={editTelephone}
                      onChange={(e) => setEditTelephone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Gestion du compte d'accès */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Gestion du compte d'accès
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Rôle de sécurité</Label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                    >
                      <option value="employe">Employé (Accès restreint Espace Collaborateur)</option>
                      <option value="admin">Administrateur IT (Accès complet au parc et tickets)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Réinitialiser le mot de passe (laisser vide pour conserver)
                    </Label>
                    <Input
                      type="password"
                      placeholder="Nouveau mot de passe (min. 4 car.)"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingEmp(null)}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditingSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isEditingSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL CRÉATION EMPLOYÉ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  Ajouter un nouvel employé
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Renseignez les informations de l'employé Touba Gaz.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateEmploye}>
              <CardContent className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Prénom *</Label>
                    <Input
                      required
                      placeholder="ex: Moussa"
                      value={formPrenom}
                      onChange={(e) => setFormPrenom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Nom *</Label>
                    <Input
                      required
                      placeholder="ex: Diop"
                      value={formNom}
                      onChange={(e) => setFormNom(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Service de rattachement</Label>
                  <select
                    value={formServiceId}
                    onChange={(e) => setFormServiceId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">E-mail professionnel</Label>
                    <Input
                      type="email"
                      placeholder="moussa.diop@toubagaz.sn"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Téléphone pro</Label>
                    <Input
                      placeholder="+221 77 000 00 00"
                      value={formTelephone}
                      onChange={(e) => setFormTelephone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section Compte utilisateur */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-900">Créer un compte d’accès</span>
                    </div>
                    <input
                      type="checkbox"
                      id="creer_compte"
                      checked={formCreerCompte}
                      onChange={(e) => setFormCreerCompte(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>

                  {formCreerCompte && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Rôle attribué</Label>
                        <select
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value as any)}
                          className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                        >
                          <option value="employe">Employé (Espace Collaborateur)</option>
                          <option value="admin">Administrateur IT (Tableau de bord complet)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Mot de passe temporaire</Label>
                        <Input
                          type="text"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer l'employé"
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
