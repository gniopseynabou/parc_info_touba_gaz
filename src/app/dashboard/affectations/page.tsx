"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Plus,
  RefreshCw,
  User,
  Building2,
  Loader2,
  X,
  FileQuestion,
  CheckCircle2,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Affectation, Equipement, Employe, Service } from "@/types";
import { formatDateFr } from "@/lib/constants";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function AffectationsPage() {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal d'affectation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState("");
  const [cibleType, setCibleType] = useState<"employe" | "service">("employe");
  const [selectedCibleId, setSelectedCibleId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resAff, resEq, resEmp, resSrv] = await Promise.all([
        fetch("/api/affectations"),
        fetch("/api/equipements"),
        fetch("/api/employes"),
        fetch("/api/services"),
      ]);

      const jsonAff = await resAff.json();
      const jsonEq = await resEq.json();
      const jsonEmp = await resEmp.json();
      const jsonSrv = await resSrv.json();

      if (jsonAff.success) setAffectations(jsonAff.data);
      if (jsonEq.success) {
        setEquipements(jsonEq.data);
        if (jsonEq.data.length > 0 && !selectedEqId) setSelectedEqId(jsonEq.data[0].id);
      }
      if (jsonEmp.success) {
        setEmployes(jsonEmp.data);
        if (jsonEmp.data.length > 0 && !selectedCibleId) setSelectedCibleId(jsonEmp.data[0].id);
      }
      if (jsonSrv.success) setServices(jsonSrv.data);
    } catch {
      toast.error("Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setDateDebut(new Date().toISOString().slice(0, 10));
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateAffectation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId || !selectedCibleId) {
      toast.error("Veuillez sélectionner un équipement et un bénéficiaire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: selectedEqId,
          cible_type: cibleType,
          cible_id: selectedCibleId,
          date_debut: dateDebut,
          commentaire,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Affectation enregistrée avec succès.");
        setIsModalOpen(false);
        setCommentaire("");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de l'enregistrement.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloturerAffectation = async (aff: Affectation) => {
    const today = new Date().toISOString().slice(0, 10);
    const dateFin = prompt(
      `Date de fin pour la restitution de cet équipement (${aff.equipement_type}) :`,
      today
    );
    if (!dateFin) return;

    try {
      const res = await fetch(`/api/affectations/${aff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_fin: dateFin }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Affectation clôturée. Le matériel est réintégré en stock.");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la clôture.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <PageHeader
        title="Affectations du matériel"
        description="Traçabilité nominative et par service des dotations d'équipements informatiques."
        icon={Share2}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle affectation
          </Button>
        </div>
      </PageHeader>

      {/* Tableau des Affectations */}
      <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Bénéficiaire</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Commentaire</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Chargement des affectations...
                  </td>
                </tr>
              ) : affectations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileQuestion className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    Aucune affectation enregistrée.
                  </td>
                </tr>
              ) : (
                affectations.map((aff) => {
                  const isActive = !aff.date_fin;
                  return (
                    <tr key={aff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {aff.equipement_type}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {aff.equipement_label}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {aff.employe_nom ? (
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <User className="h-3.5 w-3.5 text-emerald-600" />
                            {aff.employe_nom}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            {aff.service_nom}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {aff.employe_nom ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            Personnel
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                            Service
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          Du {formatDateFr(aff.date_debut)}
                        </div>
                        {aff.date_fin && (
                          <div className="text-xs text-slate-500">
                            Au {formatDateFr(aff.date_fin)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                            Clôturée
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                        {aff.commentaire || "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCloturerAffectation(aff)}
                            className="h-8 border-slate-200 bg-white text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
                            title="Clôturer cette affectation (restituer le matériel)"
                          >
                            <CheckSquare className="h-3.5 w-3.5 mr-1 text-amber-600" />
                            Clôturer
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Terminée</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Affectation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg border-slate-200 bg-white text-slate-900 shadow-xl rounded-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-emerald-600" />
                  Nouvelle Affectation
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Assigner un matériel à un utilisateur ou à un département
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleCreateAffectation}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Choix de l'équipement */}
                <div className="space-y-1.5">
                  <Label htmlFor="equipement" className="text-slate-700 font-semibold">
                    Équipement à affecter *
                  </Label>
                  <select
                    id="equipement"
                    value={selectedEqId}
                    onChange={(e) => setSelectedEqId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                  >
                    {equipements.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.type} - {eq.marque} {eq.modele} ({eq.numero_serie || "S/N non renseigné"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type de cible */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-semibold">Type de bénéficiaire *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCibleType("employe");
                        if (employes.length > 0) setSelectedCibleId(employes[0].id);
                      }}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        cibleType === "employe"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Employé individuel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCibleType("service");
                        if (services.length > 0) setSelectedCibleId(services[0].id);
                      }}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        cibleType === "service"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                      Service partagé
                    </button>
                  </div>
                </div>

                {/* Sélection de la cible */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-semibold">
                    {cibleType === "employe" ? "Sélectionner l'employé *" : "Sélectionner le service *"}
                  </Label>
                  <select
                    value={selectedCibleId}
                    onChange={(e) => setSelectedCibleId(e.target.value)}
                    className="w-full h-10 rounded-lg bg-white border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                  >
                    {cibleType === "employe"
                      ? employes.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.prenom} {emp.nom} ({emp.service_nom || "Sans service"})
                          </option>
                        ))
                      : services.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.nom}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Date de début */}
                <div className="space-y-1.5">
                  <Label htmlFor="date_debut" className="text-slate-700 font-semibold">
                    Date de prise d'effet *
                  </Label>
                  <Input
                    id="date_debut"
                    type="date"
                    required
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>

                {/* Commentaire */}
                <div className="space-y-1.5">
                  <Label htmlFor="comm" className="text-slate-700 font-semibold">
                    Commentaire / Emplacement précis
                  </Label>
                  <textarea
                    id="comm"
                    rows={2}
                    placeholder="ex: Poste attribué au bureau 102 RDC, validation responsable..."
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 p-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Enregistrement...
                    </>
                  ) : (
                    "Valider l'affectation"
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
