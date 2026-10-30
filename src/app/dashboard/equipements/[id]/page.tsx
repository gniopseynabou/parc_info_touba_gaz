"use client";

import { Suspense } from "react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Laptop,
  ArrowLeft,
  CheckCircle2,
  History,
  LifeBuoy,
  Share2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Equipement, Affectation, Ticket, EtatEquipement } from "@/types";
import { ETATS_EQUIPEMENTS, STATUTS_TICKETS, formatCodeEquipement, formatNumeroTicket, formatDateFr } from "@/lib/constants";
import { toast } from "sonner";

interface EquipementDetailData extends Equipement {
  historique?: Affectation[];
  tickets?: Ticket[];
}

function EquipementDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [eq, setEq] = useState<EquipementDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingEtat, setIsUpdatingEtat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEtat, setSelectedEtat] = useState<EtatEquipement>("en_service");

  const handleArchiveEquipement = async () => {
    if (!confirm("Voulez-vous vraiment archiver cet équipement du parc informatique Touba Gaz ?")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Équipement archivé avec succès.");
        router.push("/dashboard/equipements");
      } else {
        toast.error(json.message || "Impossible d'archiver cet équipement.");
      }
    } catch {
      toast.error("Erreur serveur lors de l'archivage.");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadEquipement = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/equipements/${id}`);
      const json = await res.json();
      if (json.success) {
        setEq(json.data);
        setSelectedEtat(json.data.etat);
      } else {
        toast.error("Équipement introuvable.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEquipement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateEtat = async () => {
    setIsUpdatingEtat(true);
    try {
      const res = await fetch(`/api/equipements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etat: selectedEtat }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("État mis à jour avec succès !");
        loadEquipement();
      } else {
        toast.error("Impossible de modifier l'état.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setIsUpdatingEtat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-400 mb-2" />
        Chargement de la fiche équipement...
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-4">
        <p>Cet équipement n&apos;existe pas ou a été supprimé.</p>
        <Link href="/dashboard/equipements">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Retour à l&apos;inventaire
          </Button>
        </Link>
      </div>
    );
  }

  const etatInfo = ETATS_EQUIPEMENTS[eq.etat] || {
    label: eq.etat,
    badgeClass: "bg-slate-800 text-slate-400",
    dotClass: "bg-slate-500",
  };

  return (
    <div className="space-y-6">
      {/* Retour & En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/equipements">
            <Button variant="outline" size="xs" className="h-8 border-slate-700 text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-teal-400">
                {formatCodeEquipement(eq.code)}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${etatInfo.badgeClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${etatInfo.dotClass}`} />
                {etatInfo.label}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {eq.type} • {eq.marque} {eq.modele}
            </h1>
          </div>
        </div>

        {/* Actions : changer statut + archiver */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <select
              value={selectedEtat}
              onChange={(e) => setSelectedEtat(e.target.value as EtatEquipement)}
              className="h-10 text-sm rounded-lg bg-slate-950 border border-slate-700 px-3 text-white outline-none focus:border-green-500"
            >
              <option value="en_service">En service</option>
              <option value="en_maintenance">En maintenance</option>
              <option value="en_panne">En panne</option>
              <option value="reforme">Réformé</option>
            </select>
            <Button
              size="sm"
              onClick={handleUpdateEtat}
              disabled={isUpdatingEtat || selectedEtat === eq.etat}
              className="h-10 bg-green-600 px-3 text-sm text-white hover:bg-green-500"
            >
              {isUpdatingEtat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Modifier statut
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleArchiveEquipement}
            disabled={isDeleting}
            className="h-10 border-rose-800/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white"
          >
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5 text-rose-400" />}
            Archiver
          </Button>
        </div>
      </div>

      {/* Grille principale : Détails techniques & Affectation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Caractéristiques techniques */}
        <Card className="border-slate-800 bg-slate-900/80 md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="h-4 w-4 text-teal-400" />
              Fiche Technique
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Spécifications et identifiants du matériel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Type de matériel</span>
                <span className="font-semibold text-white">{eq.type}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Marque & Modèle</span>
                <span className="font-semibold text-white">{eq.marque || "—"} {eq.modele || ""}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Numéro de série (S/N)</span>
                <span className="font-mono font-semibold text-teal-300">{eq.numero_serie || "Inconnu"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Date d&apos;acquisition</span>
                <span className="font-semibold text-white">{formatDateFr(eq.date_achat)}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Localisation actuelle</span>
                <span className="font-semibold text-white">{eq.localisation || "Non définie"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Statut dans le parc</span>
                <span className="font-semibold text-white">{etatInfo.label}</span>
              </div>
            </div>

            {eq.description && (
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Notes techniques / Configuration</span>
                <p className="text-slate-300 leading-relaxed">{eq.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affectation en cours */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="h-4 w-4 text-teal-400" />
              Affectation Active
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Attribution actuelle du matériel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {eq.affectation_actuelle ? (
              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/40 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Matériel Attribué</span>
                </div>
                <div className="text-white font-bold text-base">
                  {eq.affectation_actuelle}
                </div>
                <Link href="/dashboard/affectations" className="block pt-2">
                  <Button variant="outline" size="xs" className="w-full text-xs border-teal-700/60 text-teal-300 hover:text-white">
                    Gérer les affectations
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <p className="text-slate-400">Ce matériel est actuellement en stock (non affecté).</p>
                <Link href="/dashboard/affectations">
                  <Button size="xs" className="bg-green-600 hover:bg-green-500 text-white">
                    Affecter ce matériel
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des affectations & Tickets associés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historique des affectations */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-teal-400" />
              Historique des Affectations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!eq.historique || eq.historique.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucun historique d&apos;affectation disponible.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {eq.historique.map((h) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {h.employe_nom ? `Employé : ${h.employe_nom}` : `Service : ${h.service_nom}`}
                      </div>
                      <div className="text-xs text-slate-400">
                        Du {formatDateFr(h.date_debut)} {h.date_fin ? `au ${formatDateFr(h.date_fin)}` : "(actuel)"}
                      </div>
                    </div>
                    {h.date_fin ? (
                      <span className="text-xs px-1.5 py-1 rounded bg-slate-800 text-slate-300">Terminée</span>
                    ) : (
                      <span className="text-xs px-1.5 py-1 rounded bg-green-950 text-green-300 border border-green-800/40">Active</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets liés à cet équipement */}
        <Card className="border-slate-800 bg-slate-900/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-teal-400" />
              Incidents & Demandes Liées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!eq.tickets || eq.tickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucun ticket d&apos;assistance signalé pour cet équipement.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {eq.tickets.map((t) => {
                  const statutInfo = STATUTS_TICKETS[t.statut] || { label: t.statut, badgeClass: "" };
                  return (
                    <div key={t.id} className="py-2.5 flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-teal-400">{formatNumeroTicket(t.numero)}</span>
                          <span className="text-slate-300 font-medium">{t.demandeur_nom}</span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-1">{t.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${statutInfo.badgeClass}`}>
                        {statutInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EquipementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm text-slate-400" aria-busy="true">
          Chargement de la fiche équipement...
        </div>
      }
    >
      <EquipementDetailContent params={params} />
    </Suspense>
  );
}
