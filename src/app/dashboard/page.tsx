import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Laptop,
  LifeBuoy,
  Plus,
  Share2,
  TrendingUp,
  Building2,
  Clock,
  Wrench,
  Ban,
  Archive,
  ServerCrash,
  Users,
  ExternalLink,
  Package,
} from "lucide-react";
import {
  formatDateFr,
  formatNumeroTicket,
  PRIORITES_TICKETS,
  STATUTS_TICKETS,
} from "@/lib/constants";
import pool from "@/lib/db";
import { DashboardStats, Ticket } from "@/types";
import { RowDataPacket } from "mysql2";

interface DashboardTicketRow extends RowDataPacket {
  id: string;
  numero: number;
  description: string;
  priorite: Ticket["priorite"];
  statut: Ticket["statut"];
  created_at: string;
  demandeur_nom: string | null;
  service_nom: string | null;
}

interface ServiceEquipementStat extends RowDataPacket {
  service_nom: string;
  total_equipements: number;
}

type RecentTicket = Pick<
  Ticket,
  | "id"
  | "numero"
  | "description"
  | "priorite"
  | "statut"
  | "created_at"
  | "demandeur_nom"
  | "service_nom"
>;

interface DashboardData {
  stats: DashboardStats;
  recentTickets: RecentTicket[];
  totalTicketsCount: number;
  equipementsParService: ServiceEquipementStat[];
  totalServicesCount: number;
  snapshotTime: string;
  error?: string;
}

async function getDashboardData(): Promise<DashboardData> {
  const snapshotTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const [statsRows] = await pool.query<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM equipements WHERE archive = 0) as totalEquipements,
        (SELECT SUM(CASE WHEN etat = 'en_service' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnService,
        (SELECT SUM(CASE WHEN etat = 'en_panne' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnPanne,
        (SELECT SUM(CASE WHEN etat = 'en_maintenance' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnMaintenance,
        (SELECT SUM(CASE WHEN (etat = 'hors_service' OR etat = 'reforme') AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsHorsService,
        (SELECT COUNT(*) FROM tickets) as totalTickets,
        (SELECT SUM(CASE WHEN statut = 'nouveau' THEN 1 ELSE 0 END) FROM tickets) as ticketsNouveaux,
        (SELECT SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) FROM tickets) as ticketsEnCours,
        (SELECT SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) FROM tickets) as ticketsEnAttente,
        (SELECT SUM(CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END) FROM tickets) as ticketsResolus,
        (SELECT SUM(CASE WHEN statut = 'cloture' THEN 1 ELSE 0 END) FROM tickets) as ticketsClotures,
        (SELECT COUNT(*) FROM employes WHERE actif = 1) as totalEmployes,
        (SELECT COUNT(*) FROM services WHERE archive = 0) as totalServices,
        (SELECT COUNT(*) FROM affectations WHERE date_fin IS NULL) as totalAffectationsActives
    `);

    // Récupérer les tickets récents (limité aux 4 premiers selon la règle de la photo)
    const [ticketRows] = await pool.query<DashboardTicketRow[]>(`
      SELECT t.id, t.numero, t.description, t.priorite, t.statut, t.created_at,
             CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
             srv.nom as service_nom
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    // Répartition des équipements affectés par service
    const [serviceRows] = await pool.query<ServiceEquipementStat[]>(`
      SELECT 
        s.nom as service_nom,
        COUNT(DISTINCT a.id) as total_equipements
      FROM services s
      LEFT JOIN (
        SELECT id, service_id FROM affectations WHERE date_fin IS NULL AND service_id IS NOT NULL
        UNION ALL
        SELECT a.id, e.service_id FROM affectations a
        JOIN employes e ON e.id = a.employe_id
        WHERE a.date_fin IS NULL AND a.employe_id IS NOT NULL
      ) a ON a.service_id = s.id
      WHERE s.archive = 0
      GROUP BY s.id, s.nom
      ORDER BY total_equipements DESC, s.nom ASC
    `);

    const row = statsRows[0] ?? {};
    const horsServiceCount = Number(row.equipementsHorsService ?? row.equipementsReformes ?? 0);
    const stats: DashboardStats = {
      totalEquipements: Number(row.totalEquipements ?? 0),
      equipementsEnService: Number(row.equipementsEnService ?? 0),
      equipementsEnPanne: Number(row.equipementsEnPanne ?? 0),
      equipementsEnMaintenance: Number(row.equipementsEnMaintenance ?? 0),
      equipementsHorsService: horsServiceCount,
      equipementsReformes: horsServiceCount,
      totalTickets: Number(row.totalTickets ?? 0),
      ticketsNouveaux: Number(row.ticketsNouveaux ?? 0),
      ticketsEnCours: Number(row.ticketsEnCours ?? 0),
      ticketsEnAttente: Number(row.ticketsEnAttente ?? 0),
      ticketsResolus: Number(row.ticketsResolus ?? 0),
      ticketsClotures: Number(row.ticketsClotures ?? 0),
      totalEmployes: Number(row.totalEmployes ?? 0),
      totalServices: Number(row.totalServices ?? 0),
      totalAffectationsActives: Number(row.totalAffectationsActives ?? 0),
    };

    const recentTickets: RecentTicket[] = ticketRows.map((r) => ({
      id: r.id,
      numero: r.numero,
      description: r.description,
      priorite: r.priorite,
      statut: r.statut,
      created_at: r.created_at,
      demandeur_nom: r.demandeur_nom || undefined,
      service_nom: r.service_nom || undefined,
    }));

    return {
      stats,
      recentTickets,
      totalTicketsCount: stats.totalTickets,
      equipementsParService: serviceRows,
      totalServicesCount: serviceRows.length,
      snapshotTime,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Erreur de connexion MySQL";
    console.error("Dashboard Server Component error:", errorMsg);

    return {
      stats: {
        totalEquipements: 0,
        equipementsEnService: 0,
        equipementsEnPanne: 0,
        equipementsEnMaintenance: 0,
        equipementsHorsService: 0,
        equipementsReformes: 0,
        totalTickets: 0,
        ticketsNouveaux: 0,
        ticketsEnCours: 0,
        ticketsEnAttente: 0,
        ticketsResolus: 0,
        ticketsClotures: 0,
        totalEmployes: 0,
        totalServices: 0,
        totalAffectationsActives: 0,
      },
      recentTickets: [],
      totalTicketsCount: 0,
      equipementsParService: [],
      totalServicesCount: 0,
      snapshotTime,
      error: errorMsg,
    };
  }
}

async function DashboardContent() {
  const result = await getDashboardData();

  if (result.error) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-xs">
          <div className="flex items-start gap-3">
            <ServerCrash className="size-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-base font-bold text-rose-900">
                Connexion à la base de données momentanément indisponible
              </h2>
              <p className="text-sm text-rose-700 leading-relaxed">
                Le serveur n'a pas pu joindre MySQL ({result.error}).
                Vérifiez que votre service MySQL local est actif.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const {
    stats,
    recentTickets = [],
    totalTicketsCount,
    equipementsParService = [],
    totalServicesCount,
    snapshotTime,
  } = result;

  const tauxDisponibilite =
    stats.totalEquipements > 0
      ? Math.round((stats.equipementsEnService / stats.totalEquipements) * 100)
      : 100;

  const ticketsOuverts =
    stats.ticketsNouveaux + stats.ticketsEnCours + stats.ticketsEnAttente;

  // RÈGLE : Afficher 4 cartes maximum dans chaque section (comme la photo de référence)
  const visibleTickets = recentTickets.slice(0, 4);
  const visibleServices = equipementsParService.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. SECTION 4 CARTES KPI HORIZONTALES (Exactement comme la photo : icône à gauche, titre, chiffre 0, bouton Gérer, carte Créer) */}
      <section aria-label="Indicateurs clés du parc">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Carte 1 : Total Équipements (Stock) */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700">
                <Laptop className="size-6" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-tight">
                  Total Équipements
                </p>
                <p className="text-[11px] text-slate-400 font-normal">
                  (Parc global)
                </p>
              </div>
              <Link
                href="/dashboard/equipements"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              >
                Gérer
              </Link>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {stats.totalEquipements}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {tauxDisponibilite}% opérationnels
              </p>
            </div>
          </div>

          {/* Carte 2 : En service */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-tight">
                  En service
                </p>
                <p className="text-[11px] text-slate-400 font-normal">
                  (Opérationnel)
                </p>
              </div>
              <Link
                href="/dashboard/equipements"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              >
                Gérer
              </Link>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {stats.equipementsEnService}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-600">
                Disponibles & en dotation
              </p>
            </div>
          </div>

          {/* Carte 3 : Demandes d'assistance (Tickets actifs) */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600">
                <LifeBuoy className="size-6" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-tight">
                  Tickets Actifs
                </p>
                <p className="text-[11px] text-slate-400 font-normal">
                  (En attente)
                </p>
              </div>
              <Link
                href="/dashboard/tickets"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              >
                Gérer
              </Link>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {ticketsOuverts}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {stats.ticketsNouveaux} nouv. · {stats.ticketsEnCours} en cours
              </p>
            </div>
          </div>

          {/* Carte 4 : Action directe (comme 'Créer un EDB' sur la photo) */}
          <Link
            href="/dashboard/tickets"
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                  Créer un ticket
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Signaler un incident
                </p>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <Plus className="size-6" />
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Déclarer une panne</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Onglets légers de filtrage rapide (comme 'Stock | Standard | ODM' sur la photo) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
        <Link
          href="/dashboard"
          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-2xs"
        >
          Vue générale
        </Link>
        <Link
          href="/dashboard/equipements"
          className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
        >
          Parc matériel
        </Link>
        <Link
          href="/dashboard/tickets"
          className="px-4 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
        >
          Assistance IT
        </Link>
      </div>

      {/* 2. SECTION CENTRALE : TABLEAU D'ACTIVITÉ + CARTES STATS (Disposé exactement comme la photo de référence) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Colonne gauche (7 colonnes) : Tableau des demandes récentes avec bouton 'Voir tout ↗' */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Demandes d'assistance récentes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Derniers signalements d'incidents
                </p>
              </div>

              {/* Bouton Voir tout ↗ (exactement comme la photo de référence) */}
              <Link
                href="/dashboard/tickets"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                <span>Voir tout</span>
                <span className="text-slate-400">↗</span>
              </Link>
            </div>

            {/* Tableau lisible épuré */}
            <div className="mt-4 overflow-x-auto">
              {visibleTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Aucun ticket enregistré.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 px-4">Demandeur</th>
                      <th className="pb-3 px-4">Statut</th>
                      <th className="pb-3 pl-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {visibleTickets.map((tck) => {
                      const status = STATUTS_TICKETS[tck.statut];
                      return (
                        <tr key={tck.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block font-mono">
                              #{formatNumeroTicket(tck.numero)}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {formatDateFr(tck.created_at)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {tck.demandeur_nom || "Demandeur"}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {tck.service_nom || "Touba Gaz"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                                status?.badgeClass || "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {status?.label || tck.statut}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 max-w-[180px]">
                            <p className="line-clamp-2 text-slate-600 font-medium leading-relaxed">
                              {tck.description}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : Carte Mon Activité (comme sur la photo de référence) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Mon Activité
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Novembre 2026
              </p>
            </div>

            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Disponibilité du parc</span>
                <span className="font-bold text-emerald-600">{tauxDisponibilite}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${tauxDisponibilite}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Total Employés</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalEmployes}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium">Affectations</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.totalAffectationsActives}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Données synchronisées en temps réel
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
              <span className="size-2 rounded-full bg-emerald-500" />
              Opérationnel
            </span>
          </div>
        </div>
      </section>

      {/* 3. SECTION LIENS RAPIDES (Req 6 : Uniquement des routes existantes, vérifiées et actives) */}
      <section aria-label="Liens rapides" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-600" />
              Liens rapides de gestion
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Accès direct aux modules clés d'administration du parc
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/equipements"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 border border-slate-200/80 group-hover:scale-105 transition-transform">
                <Laptop className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Parc Informatique
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Inventaire, fiches, états & photos
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>Gérer le matériel</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/dashboard/affectations"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 border border-slate-200/80 group-hover:scale-105 transition-transform">
                <Share2 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Dotations & Affectations
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Attribution aux employés & services
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>Suivre les dotations</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 border border-slate-200/80 group-hover:scale-105 transition-transform">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Assistance IT
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Gestion des pannes & dépannages
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>Résoudre les tickets</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/dashboard/rapports"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 border border-slate-200/80 group-hover:scale-105 transition-transform">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Rapports & Bilans DSI
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Exports PDF officiels & graphiques
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
              <span>Générer un bilan</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. SECTION BAS : RÉPARTITION PAR SERVICE (4 SERVICES MAX AVEC LIEN 'VOIR TOUT ↗') */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="size-5 text-emerald-600" />
              Équipements par service
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ventilation du matériel informatique par direction
            </p>
          </div>

          {totalServicesCount > 4 && (
            <Link
              href="/dashboard/services"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
            >
              <span>Voir tout</span>
              <span className="text-slate-400">↗</span>
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleServices.map((srv) => (
            <div
              key={srv.service_nom}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                  {srv.service_nom}
                </span>
                <span className="text-xs font-bold text-emerald-700 tabular-nums">
                  {srv.total_equipements} <span className="text-[10px] font-normal text-slate-400">unités</span>
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.round(
                        (srv.total_equipements /
                          Math.max(
                            ...equipementsParService.map((s) => s.total_equipements),
                            1
                          )) *
                          100
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6" aria-label="Chargement du tableau de bord" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="lg:col-span-5 h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
