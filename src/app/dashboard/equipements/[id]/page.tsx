"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Laptop,
  ArrowLeft,
  Calendar,
  MapPin,
  Barcode,
  Clock,
  User,
  Building2,
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  Save,
  Loader2,
  LifeBuoy,
  Camera,
  Upload,
  X,
  ImageIcon,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Equipement, EtatEquipement } from "@/types";
import {
  ETATS_EQUIPEMENTS,
  TYPES_EQUIPEMENTS,
  formatCodeEquipement,
  formatDateFr,
  formatNumeroTicket,
  STATUTS_TICKETS,
  PRIORITES_TICKETS,
} from "@/lib/constants";
import { toast } from "sonner";

interface AffectationHistorique {
  id: string;
  equipement_id: string;
  employe_id: string | null;
  service_id: string | null;
  date_debut: string;
  date_fin: string | null;
  commentaire: string | null;
  employe_nom?: string;
  service_nom?: string;
}

interface TicketLie {
  id: string;
  numero: number;
  description: string;
  statut: keyof typeof STATUTS_TICKETS;
  priorite: keyof typeof PRIORITES_TICKETS;
  created_at: string;
  demandeur_nom?: string;
}

interface EquipementDetailData extends Equipement {
  affectation_id?: string;
  affectation_date_debut?: string;
  affectation_commentaire?: string;
  affectation_employe_id?: string;
  affectation_service_id?: string;
  affectation_cible_type?: "employe" | "service";
  historique: AffectationHistorique[];
  tickets: TicketLie[];
}

export default function EquipementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<EquipementDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Formulaire d'édition
  const [type, setType] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [dateAchat, setDateAchat] = useState("");
  const [etat, setEtat] = useState<EtatEquipement>("en_service");
  const [localisation, setLocalisation] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // État du modal d'affectation / réaffectation directe
  const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
  const [affectationStep, setAffectationStep] = useState<"cloture_confirm" | "nouvelle">("nouvelle");
  const [isSubmittingAffectation, setIsSubmittingAffectation] = useState(false);
  const [employesList, setEmployesList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [filterModalService, setFilterModalService] = useState<string>("tous");

  // Champs de clôture (Étape 1)
  const [clotureDateFin, setClotureDateFin] = useState<string>(new Date().toISOString().slice(0, 10));
  const [clotureCommentaire, setClotureCommentaire] = useState<string>("");

  // Champs de nouvelle affectation (Étape 2)
  const [nouvelleCibleType, setNouvelleCibleType] = useState<"employe" | "service">("employe");
  const [nouvelleCibleId, setNouvelleCibleId] = useState<string>("");
  const [nouvelleDateDebut, setNouvelleDateDebut] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nouvelleCommentaire, setNouvelleCommentaire] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/equipements/${id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        const eq = json.data as EquipementDetailData;
        setData(eq);
        setType(eq.type || TYPES_EQUIPEMENTS[0]);
        setMarque(eq.marque || "");
        setModele(eq.modele || "");
        setNumeroSerie(eq.numero_serie || "");
        setDateAchat(eq.date_achat ? eq.date_achat.slice(0, 10) : "");
        setEtat((eq.etat as any) === "reforme" ? "hors_service" : (eq.etat || "en_service"));
        setLocalisation(eq.localisation || "");
        setDescription(eq.description || "");
        setPhotoUrl(eq.photo || null);
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        toast.error(json.message || "Équipement introuvable.");
        router.push("/dashboard/equipements");
      }
    } catch {
      toast.error("Impossible de contacter le serveur MySQL.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployesAndServices = async () => {
    try {
      const [resEmp, resSrv] = await Promise.all([
        fetch("/api/employes"),
        fetch("/api/services"),
      ]);
      const jsonEmp = await resEmp.json();
      const jsonSrv = await resSrv.json();
      if (resEmp.ok && jsonEmp.success) {
        setEmployesList(jsonEmp.data || []);
      }
      if (resSrv.ok && jsonSrv.success) {
        setServicesList(jsonSrv.data || []);
      }
    } catch {
      // Ignorer silencieusement ou fallback
    }
  };

  useEffect(() => {
    loadData();
    loadEmployesAndServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Ouverture du modal pour affecter un matériel libre (va directement à l'étape 2)
  const openNouvelleAffectation = () => {
    setAffectationStep("nouvelle");
    setNouvelleCibleType("employe");
    setNouvelleCibleId("");
    setNouvelleDateDebut(new Date().toISOString().slice(0, 10));
    setNouvelleCommentaire("");
    setFilterModalService("tous");
    setIsAffectationModalOpen(true);
  };

  // Ouverture du modal pour réaffecter ou clôturer un matériel déjà affecté (commence à l'étape 1)
  const openClotureOrReaffectation = () => {
    setAffectationStep("cloture_confirm");
    setClotureDateFin(new Date().toISOString().slice(0, 10));
    setClotureCommentaire(
      data?.affectation_commentaire
        ? `Clôture de l'affectation précédente (${data.affectation_commentaire})`
        : "Clôture d'affectation pour réaffectation ou remise en stock"
    );
    setNouvelleCibleType("employe");
    setNouvelleCibleId("");
    setNouvelleDateDebut(new Date().toISOString().slice(0, 10));
    setNouvelleCommentaire("");
    setFilterModalService("tous");
    setIsAffectationModalOpen(true);
  };

  // Action : Clôturer uniquement (retour en stock sans nouvelle affectation)
  const handleCloturerVersStock = async () => {
    if (!data?.affectation_id) {
      toast.error("Aucune affectation active à clôturer.");
      return;
    }
    setIsSubmittingAffectation(true);
    try {
      const res = await fetch(`/api/affectations/${data.affectation_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_fin: clotureDateFin || new Date().toISOString().slice(0, 10),
          commentaire: clotureCommentaire.trim() || "Affectation clôturée. Matériel remis en stock.",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Affectation clôturée. Le matériel est désormais disponible en stock.");
        setIsAffectationModalOpen(false);
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la clôture.");
      }
    } catch {
      toast.error("Erreur serveur lors de la clôture.");
    } finally {
      setIsSubmittingAffectation(false);
    }
  };

  // Action : Confirmer la clôture de l'ancienne affectation puis passer à l'étape 2 (Nouvelle affectation)
  const handleConfirmerClotureEtContinuer = async () => {
    if (!data?.affectation_id) {
      setAffectationStep("nouvelle");
      return;
    }
    setIsSubmittingAffectation(true);
    try {
      const res = await fetch(`/api/affectations/${data.affectation_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_fin: clotureDateFin || new Date().toISOString().slice(0, 10),
          commentaire: clotureCommentaire.trim() || "Affectation clôturée pour réaffectation.",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Ancienne affectation clôturée avec succès.");
        setAffectationStep("nouvelle");
      } else {
        toast.error(json.message || "Impossible de clôturer l'affectation actuelle.");
      }
    } catch {
      toast.error("Erreur serveur lors de la clôture.");
    } finally {
      setIsSubmittingAffectation(false);
    }
  };

  // Action : Valider et enregistrer la nouvelle affectation (Étape 2)
  const handleValiderNouvelleAffectation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelleCibleId) {
      toast.error(
        nouvelleCibleType === "employe"
          ? "Veuillez sélectionner un collaborateur."
          : "Veuillez sélectionner un service."
      );
      return;
    }

    setIsSubmittingAffectation(true);
    try {
      const res = await fetch("/api/affectations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: id,
          cible_type: nouvelleCibleType,
          cible_id: nouvelleCibleId,
          date_debut: nouvelleDateDebut || new Date().toISOString().slice(0, 10),
          commentaire: nouvelleCommentaire.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Nouvelle affectation enregistrée avec succès.");
        setIsAffectationModalOpen(false);
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la réaffectation.");
      }
    } catch {
      toast.error("Erreur serveur lors de la réaffectation.");
    } finally {
      setIsSubmittingAffectation(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formats acceptés : JPG, JPEG, PNG, WEBP.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/equipements/upload", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json.photoUrl;
    }
    throw new Error(json.message || "Échec de l'upload de la photo.");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim()) {
      toast.error("Le type d'équipement est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
      let finalPhoto = photoUrl;
      if (photoFile) {
        finalPhoto = await uploadPhoto(photoFile);
      }

      const res = await fetch(`/api/equipements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          marque,
          modele,
          numero_serie: numeroSerie,
          date_achat: dateAchat || null,
          etat,
          localisation,
          description,
          photo: finalPhoto,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Informations de l'équipement mises à jour.");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur serveur lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Confirmez-vous l'archivage de cet équipement ?")) return;
    try {
      const res = await fetch(`/api/equipements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement archivé avec succès.");
        router.push("/dashboard/equipements");
      } else {
        toast.error(json.message || "Impossible d'archiver.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm">Chargement de la fiche équipement...</p>
      </div>
    );
  }

  const etatInfo = ETATS_EQUIPEMENTS[data.etat] || {
    label: data.etat === ("reforme" as any) ? "Hors service" : data.etat,
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/equipements">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'inventaire
          </Button>
        </Link>
      </div>

      <PageHeader
        title={`Fiche équipement · ${formatCodeEquipement(data.code)}`}
        description={`${data.type} ${data.marque ? "— " + data.marque : ""} ${data.modele || ""}`}
        icon={Laptop}
      >
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${etatInfo.badgeClass}`}>
            <span className={`h-2 w-2 rounded-full ${etatInfo.dotClass}`} />
            {etatInfo.label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="text-slate-500 hover:text-rose-700 hover:bg-rose-50 gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Archiver
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Formulaire de modification */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                Caractéristiques & Modifications
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Mettre à jour les spécifications techniques, la photo et l'état opérationnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Section Photo */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Photo du matériel</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {photoPreview || photoUrl ? (
                      <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview || photoUrl || ""}
                          alt="Photo équipement"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(null);
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title="Supprimer la photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 w-28 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                        <span className="text-[10px]">Aucune photo</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition-colors">
                        <Upload className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{photoUrl || photoPreview ? "Remplacer la photo" : "Téléverser une photo"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Sélectionnez un fichier JPG, JPEG, PNG ou WEBP depuis votre appareil (5 Mo max).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Type de matériel *</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
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
                    <Label className="text-xs font-semibold text-slate-700">État opérationnel *</Label>
                    <select
                      value={etat}
                      onChange={(e) => setEtat(e.target.value as EtatEquipement)}
                      className="h-10 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 shadow-xs"
                      required
                    >
                      <option value="en_service">En service</option>
                      <option value="en_panne">En panne</option>
                      <option value="en_maintenance">En maintenance</option>
                      <option value="hors_service">Hors service</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Marque</Label>
                    <Input
                      value={marque}
                      onChange={(e) => setMarque(e.target.value)}
                      placeholder="ex: Dell, HP, Cisco..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Modèle</Label>
                    <Input
                      value={modele}
                      onChange={(e) => setModele(e.target.value)}
                      placeholder="ex: Latitude 5420..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Numéro de série (S/N)</Label>
                    <Input
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                      placeholder="ex: SN-DELL-88219"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Date d'achat</Label>
                    <Input
                      type="date"
                      value={dateAchat}
                      onChange={(e) => setDateAchat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Localisation géographique</Label>
                  <Input
                    value={localisation}
                    onChange={(e) => setLocalisation(e.target.value)}
                    placeholder="ex: Bureau Informatique, RDC Salle Serveur, Bureau Comptabilité..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Observations techniques / Configuration</Label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="RAM, processeur, SSD, connectique particulière, état physique..."
                    className="w-full rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-xs cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Historique des affectations */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <History className="h-4 w-4 text-emerald-600" />
                  Historique des affectations
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Traçabilité chronologique des bénéficiaires successifs (employés et services).
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={data.affectation_actuelle ? openClotureOrReaffectation : openNouvelleAffectation}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
              >
                {data.affectation_actuelle ? "Réaffecter" : "Nouvelle affectation"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {data.historique.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Aucun historique d'affectation enregistré pour cet équipement.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Bénéficiaire</th>
                        <th className="py-2.5 px-4">Période</th>
                        <th className="py-2.5 px-4">Statut</th>
                        <th className="py-2.5 px-4">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.historique.map((aff) => {
                        const isEnCours = !aff.date_fin;
                        return (
                          <tr key={aff.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-medium">
                              {aff.employe_nom ? (
                                <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                                  <User className="h-3.5 w-3.5 text-emerald-600" />
                                  {aff.employe_nom}
                                </span>
                              ) : aff.service_nom ? (
                                <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                                  {aff.service_nom}
                                </span>
                              ) : (
                                "Non spécifié"
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                              Du {formatDateFr(aff.date_debut)} au{" "}
                              {aff.date_fin ? formatDateFr(aff.date_fin) : "Aujourd'hui"}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isEnCours ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  En dotation active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-slate-500 bg-slate-100">
                                  Clôturée
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 italic">
                              {aff.commentaire || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Synthèse & Tickets associés */}
        <div className="space-y-6">
          {/* Carte Photo & Aperçu */}
          {data.photo && (
            <Card className="border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="relative h-52 w-full bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photo}
                  alt={`${data.type} ${data.marque || ""}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3 text-xs text-slate-500 text-center border-t border-slate-100">
                Photo officielle du matériel
              </div>
            </Card>
          )}

          {/* Carte Affectation Actuelle */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Affectation en cours
              </CardTitle>
              {data.affectation_actuelle && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {data.affectation_actuelle ? (
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                    {data.affectation_cible_type === "service" ? (
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{data.affectation_actuelle}</span>
                  </div>
                  {data.affectation_date_debut && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Depuis le {formatDateFr(data.affectation_date_debut)}
                    </p>
                  )}
                  {data.affectation_commentaire && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-2 border border-slate-100 italic">
                      « {data.affectation_commentaire} »
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <Button
                      size="sm"
                      onClick={openClotureOrReaffectation}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Réaffecter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openClotureOrReaffectation}
                      className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                    >
                      Clôturer l'affectation
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 italic">Cet équipement est actuellement en stock (non affecté).</p>
                  <Button
                    size="sm"
                    onClick={openNouvelleAffectation}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    Affecter cet équipement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carte Demandes d'assistance associées */}
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                Demandes d'assistance ({data.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.tickets.length === 0 ? (
                <p className="p-5 text-center text-xs text-slate-500">
                  Aucun incident déclaré sur ce matériel.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.tickets.map((tck) => {
                    const st = STATUTS_TICKETS[tck.statut];
                    return (
                      <li key={tck.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-emerald-700">
                            #{formatNumeroTicket(tck.numero)}
                          </span>
                          <span className="text-slate-400">{formatDateFr(tck.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1 line-clamp-2">
                          {tck.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {tck.demandeur_nom || "Demandeur"}
                          </span>
                          {st && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modal Affectation / Clôture / Réaffectation */}
      {isAffectationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {affectationStep === "cloture_confirm"
                      ? "Clôturer l'affectation actuelle"
                      : "Nouvelle affectation du matériel"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {data.type} {data.marque} {data.modele} ({formatCodeEquipement(data.code)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAffectationModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corps modal - Étape 1 : Clôture */}
            {affectationStep === "cloture_confirm" && (
              <div className="p-6 space-y-5">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900">
                      Vous êtes sur le point de clôturer l'affectation actuelle de cet équipement.
                    </p>
                    <p className="mt-1 text-amber-800">
                      L'historique sera conservé avec la date de restitution. L'équipement pourra ensuite être réaffecté immédiatement ou remis en stock.
                    </p>
                  </div>
                </div>

                {/* Récapitulatif affectation actuelle */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bénéficiaire actuel :</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {data.affectation_cible_type === "service" ? (
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      {data.affectation_actuelle}
                    </span>
                  </div>
                  {data.affectation_date_debut && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date de début :</span>
                      <span className="font-medium text-slate-800">
                        {formatDateFr(data.affectation_date_debut)}
                      </span>
                    </div>
                  )}
                  {data.affectation_commentaire && (
                    <div className="flex items-start justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Motif initial :</span>
                      <span className="font-medium text-slate-700 italic max-w-[240px] text-right">
                        {data.affectation_commentaire}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Date de fin / restitution
                    </Label>
                    <Input
                      type="date"
                      value={clotureDateFin}
                      onChange={(e) => setClotureDateFin(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Commentaire ou motif de clôture
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ex: Restitution suite à fin de mission, changement de poste..."
                      value={clotureCommentaire}
                      onChange={(e) => setClotureCommentaire(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Actions Étape 1 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAffectationModalOpen(false)}
                    disabled={isSubmittingAffectation}
                    className="w-full sm:w-auto text-xs"
                  >
                    Annuler
                  </Button>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloturerVersStock}
                      disabled={isSubmittingAffectation}
                      className="w-full sm:w-auto text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      {isSubmittingAffectation ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : null}
                      Clôturer et remettre en stock
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmerClotureEtContinuer}
                      disabled={isSubmittingAffectation}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                    >
                      {isSubmittingAffectation ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      Confirmer et réaffecter
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Corps modal - Étape 2 : Nouvelle affectation */}
            {affectationStep === "nouvelle" && (
              <form onSubmit={handleValiderNouvelleAffectation} className="p-6 space-y-4">
                {/* Type de bénéficiaire : Employé ou Service */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Type de bénéficiaire <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNouvelleCibleType("employe");
                        setNouvelleCibleId("");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                        nouvelleCibleType === "employe"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <User className="h-4 w-4 text-emerald-600" />
                      Collaborateur (Employé)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNouvelleCibleType("service");
                        setNouvelleCibleId("");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                        nouvelleCibleType === "service"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Service partagé
                    </button>
                  </div>
                </div>

                {/* Cas 1 : Bénéficiaire = Employé */}
                {nouvelleCibleType === "employe" && (
                  <div className="space-y-3 rounded-lg bg-slate-50 p-3.5 border border-slate-200/80">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-600">Filtrer par service (facultatif)</Label>
                      <select
                        value={filterModalService}
                        onChange={(e) => setFilterModalService(e.target.value)}
                        className="w-full text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="tous">Tous les services</option>
                        {servicesList.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {srv.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Sélectionner l'employé <span className="text-red-500">*</span>
                      </Label>
                      <select
                        value={nouvelleCibleId}
                        onChange={(e) => setNouvelleCibleId(e.target.value)}
                        className="w-full text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">-- Choisir un collaborateur --</option>
                        {employesList
                          .filter(
                            (emp) =>
                              filterModalService === "tous" || emp.service_id === filterModalService
                          )
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.prenom} {emp.nom} {emp.service_nom ? `(${emp.service_nom})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Cas 2 : Bénéficiaire = Service */}
                {nouvelleCibleType === "service" && (
                  <div className="space-y-1.5 rounded-lg bg-slate-50 p-3.5 border border-slate-200/80">
                    <Label className="text-xs font-semibold text-slate-700">
                      Sélectionner le service <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={nouvelleCibleId}
                      onChange={(e) => setNouvelleCibleId(e.target.value)}
                      className="w-full text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Choisir un service --</option>
                      {servicesList.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.nom} {srv.code ? `(${srv.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date de début */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Date de début de dotation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={nouvelleDateDebut}
                    onChange={(e) => setNouvelleDateDebut(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                {/* Commentaire / Motif */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Motif ou commentaire d'affectation
                  </Label>
                  <Input
                    type="text"
                    placeholder="Ex: Dotation poste fixe, renouvellement PC portable..."
                    value={nouvelleCommentaire}
                    onChange={(e) => setNouvelleCommentaire(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Actions Étape 2 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (data.affectation_actuelle) {
                        setAffectationStep("cloture_confirm");
                      } else {
                        setIsAffectationModalOpen(false);
                      }
                    }}
                    disabled={isSubmittingAffectation}
                    className="text-xs"
                  >
                    {data.affectation_actuelle ? "← Retour clôture" : "Annuler"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingAffectation || !nouvelleCibleId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    {isSubmittingAffectation ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Enregistrer l'affectation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
