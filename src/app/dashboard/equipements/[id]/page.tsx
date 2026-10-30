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
        setEtat(eq.etat || "en_service");
        setLocalisation(eq.localisation || "");
        setDescription(eq.description || "");
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim()) {
      toast.error("Le type d'équipement est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
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
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Informations de l'équipement mises à jour.");
        loadData();
      } else {
        toast.error(json.message || "Erreur lors de la mise à jour.");
      }
    } catch {
      toast.error("Erreur serveur lors de l'enregistrement.");
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
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <p className="text-sm">Chargement de la fiche équipement...</p>
      </div>
    );
  }

  const etatInfo = ETATS_EQUIPEMENTS[data.etat] || {
    label: data.etat,
    badgeClass: "bg-slate-800 text-slate-400",
    dotClass: "bg-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/equipements">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
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
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Archiver
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Formulaire de modification */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-[#111c30] shadow-sm">
            <CardHeader className="border-b border-slate-800/80 px-6 py-4">
              <CardTitle className="text-base font-semibold text-white">
                Caractéristiques & Modifications
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Mettre à jour les spécifications techniques et l'état opérationnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Type de matériel *</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
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
                    <Label className="text-xs text-slate-300">État opérationnel *</Label>
                    <select
                      value={etat}
                      onChange={(e) => setEtat(e.target.value as EtatEquipement)}
                      className="h-10 w-full rounded-lg bg-[#0b1220] border border-slate-700 px-3 text-sm text-white outline-none focus:border-green-500"
                      required
                    >
                      <option value="en_service">En service</option>
                      <option value="en_panne">En panne</option>
                      <option value="en_maintenance">En maintenance</option>
                      <option value="reforme">Réformé</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Marque</Label>
                    <Input
                      value={marque}
                      onChange={(e) => setMarque(e.target.value)}
                      placeholder="ex: Dell, HP, Cisco..."
                      className="bg-[#0b1220] border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Modèle</Label>
                    <Input
                      value={modele}
                      onChange={(e) => setModele(e.target.value)}
                      placeholder="ex: Latitude 5420..."
                      className="bg-[#0b1220] border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Numéro de série (S/N)</Label>
                    <Input
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                      placeholder="ex: SN-DELL-88219"
                      className="bg-[#0b1220] border-slate-700 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Date d'achat</Label>
                    <Input
                      type="date"
                      value={dateAchat}
                      onChange={(e) => setDateAchat(e.target.value)}
                      className="bg-[#0b1220] border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Localisation géographique</Label>
                  <Input
                    value={localisation}
                    onChange={(e) => setLocalisation(e.target.value)}
                    placeholder="ex: Bureau Informatique, RDC Salle Serveur, Bureau Comptabilité..."
                    className="bg-[#0b1220] border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Observations techniques / Configuration</Label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="RAM, processeur, SSD, connectique particulière, état physique..."
                    className="w-full rounded-lg bg-[#0b1220] border border-slate-700 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-500 text-white gap-2"
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
          <Card className="border-slate-800 bg-[#111c30] shadow-sm">
            <CardHeader className="border-b border-slate-800/80 px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                  <History className="h-4 w-4 text-green-400" />
                  Historique des affectations
                </CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Traçabilité chronologique des bénéficiaires successifs (RG03, RG09).
                </CardDescription>
              </div>
              <Link href="/dashboard/affectations">
                <Button variant="outline" size="xs" className="border-slate-700 text-slate-300 hover:text-white">
                  Nouvelle affectation
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.historique.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Aucun historique d'affectation enregistré pour cet équipement.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0b1220] text-slate-400 font-medium text-xs border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Bénéficiaire</th>
                        <th className="py-2.5 px-4">Période</th>
                        <th className="py-2.5 px-4">Statut</th>
                        <th className="py-2.5 px-4">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {data.historique.map((aff) => {
                        const isEnCours = !aff.date_fin;
                        return (
                          <tr key={aff.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-medium">
                              {aff.employe_nom ? (
                                <span className="flex items-center gap-1.5 text-white">
                                  <User className="h-3.5 w-3.5 text-green-400" />
                                  {aff.employe_nom}
                                </span>
                              ) : aff.service_nom ? (
                                <span className="flex items-center gap-1.5 text-white">
                                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                                  {aff.service_nom}
                                </span>
                              ) : (
                                "Non spécifié"
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                              Du {formatDateFr(aff.date_debut)} au{" "}
                              {aff.date_fin ? formatDateFr(aff.date_fin) : "Aujourd'hui"}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isEnCours ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3" />
                                  En dotation active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-slate-400 bg-slate-800">
                                  Clôturée
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400 italic">
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
          {/* Carte Affectation Actuelle */}
          <Card className="border-slate-800 bg-[#111c30] shadow-sm">
            <CardHeader className="border-b border-slate-800/80 px-5 py-4">
              <CardTitle className="text-sm font-semibold text-white uppercase tracking-wider text-green-400">
                Affectation en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {data.affectation_actuelle ? (
                <div>
                  <div className="flex items-center gap-2 text-white font-medium text-base">
                    <User className="h-4 w-4 text-green-400" />
                    <span>{data.affectation_actuelle}</span>
                  </div>
                  {data.affectation_date_debut && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Depuis le {formatDateFr(data.affectation_date_debut)}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <Link href="/dashboard/affectations">
                      <Button size="xs" variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white">
                        Modifier ou réaffecter
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 italic">Cet équipement est actuellement en stock (non affecté).</p>
                  <Link href="/dashboard/affectations" className="mt-3 inline-block">
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white">
                      Attribuer cet équipement
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carte Demandes d'assistance associées */}
          <Card className="border-slate-800 bg-[#111c30] shadow-sm">
            <CardHeader className="border-b border-slate-800/80 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                <LifeBuoy className="h-4 w-4 text-green-400" />
                Demandes d'assistance ({data.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.tickets.length === 0 ? (
                <p className="p-5 text-center text-xs text-slate-500">
                  Aucun incident déclaré sur ce matériel.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800/60">
                  {data.tickets.map((tck) => {
                    const st = STATUTS_TICKETS[tck.statut];
                    return (
                      <li key={tck.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-green-400">
                            {formatNumeroTicket(tck.numero)}
                          </span>
                          <span className="text-slate-400">{formatDateFr(tck.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                          {tck.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
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
    </div>
  );
}
