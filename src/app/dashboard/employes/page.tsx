"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Employe, Service } from "@/types";
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
        if (jsonSrv.data.length > 0 && !formServiceId) {
          setFormServiceId(jsonSrv.data[0].id);
        }
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

  const handleCreateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom?.trim() || !formPrenom?.trim()) {
      toast.error("Nom et prénom sont requis.");
      return;
    }

    if (formCreerCompte && !formEmail?.trim()) {
      toast.error("L'adresse e-mail professionnelle est obligatoire pour créer un compte d'accès.");
      return;
    }

    if (formCreerCompte && (!formPassword || formPassword.length < 4)) {
      toast.error("Le mot de passe doit contenir au moins 4 caractères.");
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
        toast.success(json.message || "Employé ajouté avec succès !");
        setIsModalOpen(false);
        setFormNom("");
        setFormPrenom("");
        setFormEmail("");
        setFormTelephone("");
        setFormPassword("ToubaGaz@2026");
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

  const handleOpenEdit = (emp: EmployeWithRole) => {
    setEditingEmp(emp);
    setEditNom(emp.nom || "");
    setEditPrenom(emp.prenom || "");
    setEditEmail(emp.email || "");
    setEditTelephone(emp.telephone || "");
    setEditServiceId(emp.service_id || (services[0]?.id || ""));
    setEditRole(emp.user_role === "admin" ? "admin" : "employe");
    setEditNewPassword("");
  };

  const handleUpdateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

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
          password: editNewPassword?.trim() ? editNewPassword.trim() : undefined,
          creer_compte: !editingEmp.user_id && editEmail?.trim() && editNewPassword?.trim() ? true : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Informations employé mises à jour avec succès.");
        setEditingEmp(null);
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la mise à jour.");
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
        description="Personnel, services de rattachement, rôles et comptes d’accès Touba Gaz."
        icon={Users}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500 font-medium shadow-md shadow-green-600/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un employé
        </Button>
      </PageHeader>

      {/* Barre de filtres */}
      <Card className="border-slate-800 bg-slate-900/80 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par nom, prénom, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:border-green-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <Building2 className="h-4 w-4 text-green-400" aria-hidden="true" />
              <span>Service :</span>
            </div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="h-10 rounded-lg bg-slate-950/60 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
              className="border-slate-700 bg-slate-950 text-slate-200 hover:text-white"
            >
              Filtrer
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={loadData}
              className="text-slate-400 hover:text-white"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-green-400" : ""}`} />
            </Button>
          </div>
        </form>
      </Card>

      {/* Tableau des employés */}
      <Card className="border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0d1728] border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Employé</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">E-mail professionnel</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4 text-center">Rôle & Accès</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-400 mb-2" />
                    Chargement des employés...
                  </td>
                </tr>
              ) : employes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : (
                employes.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {emp.prenom} {emp.nom}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        ID: {emp.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                        <Building2 className="h-3 w-3 text-green-400" />
                        {emp.service_nom || "Non rattaché"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {emp.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{emp.email}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {emp.telephone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{emp.telephone}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {emp.user_role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                          <Shield className="h-3 w-3" />
                          Admin IT
                        </span>
                      ) : emp.user_id ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-medium">
                          <UserCheck className="h-3 w-3" />
                          Collaborateur
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">
                          Sans accès portail
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(emp)}
                          className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Modifier les coordonnées et accès"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(emp)}
                          className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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

      {/* =========================================================================
          MODAL MODIFICATION EMPLOYÉ (CU03 / CU05)
         ========================================================================= */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-slate-800 bg-[#0c1524] shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-green-400" />
                  Modifier l'employé
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {editingEmp.prenom} {editingEmp.nom} (Réf : {editingEmp.id})
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEmp(null)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleUpdateEmploye}>
              <CardContent className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Prénom *</Label>
                    <Input
                      required
                      value={editPrenom}
                      onChange={(e) => setEditPrenom(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Nom *</Label>
                    <Input
                      required
                      value={editNom}
                      onChange={(e) => setEditNom(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Service de rattachement</Label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
                    <Label className="text-xs text-slate-300">E-mail professionnel</Label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Téléphone pro</Label>
                    <Input
                      value={editTelephone}
                      onChange={(e) => setEditTelephone(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Gestion du compte d'accès (CU05) */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-semibold uppercase text-slate-300">
                      Gestion du compte d'accès
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Rôle de sécurité</Label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
                    >
                      <option value="employe">Employé (Accès restreint Espace Collaborateur)</option>
                      <option value="admin">Administrateur IT (Accès complet au parc et tickets)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Réinitialiser le mot de passe (laisser vide pour conserver)
                    </Label>
                    <Input
                      type="password"
                      placeholder="Nouveau mot de passe (min. 4 car.)"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingEmp(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditingSubmitting}
                    className="bg-green-600 hover:bg-green-500 text-white font-medium"
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

      {/* =========================================================================
          MODAL CRÉATION EMPLOYÉ
         ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-slate-800 bg-[#0c1524] shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-400" />
                  Ajouter un nouvel employé
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Renseignez les informations de l'employé Touba Gaz.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateEmploye}>
              <CardContent className="space-y-4 pt-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Prénom *</Label>
                    <Input
                      required
                      placeholder="ex: Moussa"
                      value={formPrenom}
                      onChange={(e) => setFormPrenom(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Nom *</Label>
                    <Input
                      required
                      placeholder="ex: Diop"
                      value={formNom}
                      onChange={(e) => setFormNom(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Service de rattachement</Label>
                  <select
                    value={formServiceId}
                    onChange={(e) => setFormServiceId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-slate-950 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
                    <Label className="text-xs text-slate-300">E-mail professionnel</Label>
                    <Input
                      type="email"
                      placeholder="moussa.diop@toubagaz.sn"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Téléphone pro</Label>
                    <Input
                      placeholder="+221 77 000 00 00"
                      value={formTelephone}
                      onChange={(e) => setFormTelephone(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Section Compte utilisateur */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-semibold text-white">Créer un compte d’accès</span>
                    </div>
                    <input
                      type="checkbox"
                      id="creer_compte"
                      checked={formCreerCompte}
                      onChange={(e) => setFormCreerCompte(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 text-green-600 focus:ring-green-500"
                    />
                  </div>

                  {formCreerCompte && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Rôle attribué</Label>
                        <select
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value as any)}
                          className="w-full h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
                        >
                          <option value="employe">Employé (Espace Collaborateur)</option>
                          <option value="admin">Administrateur IT (Tableau de bord complet)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Mot de passe temporaire</Label>
                        <Input
                          type="text"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-500 text-white font-medium"
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
