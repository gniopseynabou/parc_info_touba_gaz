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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/dashboard/refresh-button";
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

async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentTickets: RecentTicket[];
}> {
  const [statsRows] = await pool.query<RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM equipements) as totalEquipements,
      (SELECT SUM(CASE WHEN etat = 'en_service' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnService,
      (SELECT SUM(CASE WHEN etat = 'en_panne' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnPanne,
      (SELECT SUM(CASE WHEN etat = 'en_maintenance' AND archive = 0 THEN 1 ELSE 0 END) FROM equipements) as equipementsEnMaintenance,
      (SELECT SUM(CASE WHEN etat = 'reforme' OR archive = 1 THEN 1 ELSE 0 END) FROM equipements) as equipementsReformes,
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

  const [ticketRows] = await pool.query<DashboardTicketRow[]>(`
    SELECT t.id, t.numero, t.description, t.categorie, t.priorite, t.statut, t.created_at,
           CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
           srv.nom as service_nom
    FROM tickets t
    LEFT JOIN employes emp ON emp.id = t.demandeur_id
    LEFT JOIN services srv ON srv.id = t.service_id
    ORDER BY t.created_at DESC
    LIMIT 5
  `);

  const row = statsRows[0] ?? {};
  const stats: DashboardStats = {
    totalEquipements: Number(row.totalEquipements ?? 0),
    equipementsEnService: Number(row.equipementsEnService ?? 0),
    equipementsEnPanne: Number(row.equipementsEnPanne ?? 0),
    equipementsEnMaintenance: Number(row.equipementsEnMaintenance ?? 0),
    equipementsReformes: Number(row.equipementsReformes ?? 0),
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

  return {
    stats,
    recentTickets: ticketRows.map((ticket) => ({
      ...ticket,
      demandeur_nom: ticket.demandeur_nom ?? undefined,
      service_nom: ticket.service_nom ?? undefined,
    })),
  };
}

async function DashboardContent() {
  const { stats, recentTickets } = await getDashboardData();
  const ticketsOuverts =
    stats.ticketsNouveaux + stats.ticketsEnCours + stats.ticketsEnAttente;
  const totalEquipements = stats.totalEquipements;
  const percentage = (value: number) =>
    totalEquipements > 0 ? Math.round((value / totalEquipements) * 100) : 0;

  const indicators = [
    {
      label: "Équipements recensés",
      value: stats.totalEquipements,
      detail: `${stats.totalAffectationsActives} affectations actives`,
      icon: Laptop,
      tone: "text-green-400 bg-green-500/10",
    },
    {
      label: "En service",
      value: stats.equipementsEnService,
      detail: `${percentage(stats.equipementsEnService)} % du parc`,
      icon: CheckCircle2,
      tone: "text-green-400 bg-green-500/10",
    },
    {
      label: "À surveiller",
      value: stats.equipementsEnPanne + stats.equipementsEnMaintenance,
      detail: `${stats.equipementsEnPanne} en panne · ${stats.equipementsEnMaintenance} en maintenance`,
      icon: AlertTriangle,
      tone: "text-amber-400 bg-amber-500/10",
    },
    {
      label: "Tickets ouverts",
      value: ticketsOuverts,
      detail: `${stats.ticketsNouveaux} nouveaux · ${stats.ticketsEnCours} en cours`,
      icon: LifeBuoy,
      tone: "text-blue-400 bg-blue-500/10",
    },
  ];

  const equipmentStates = [
    { label: "En service", value: stats.equipementsEnService, color: "bg-green-500", text: "text-green-300" },
    { label: "En maintenance", value: stats.equipementsEnMaintenance, color: "bg-amber-500", text: "text-amber-300" },
    { label: "En panne", value: stats.equipementsEnPanne, color: "bg-rose-500", text: "text-rose-300" },
    { label: "Réformés ou archivés", value: stats.equipementsReformes, color: "bg-slate-500", text: "text-slate-300" },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-[#111c30] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-green-400">
            Supervision informatique
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
            Supervision du parc informatique
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Consultez l’état des équipements et suivez les demandes d’assistance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton />
          <Link href="/dashboard/tickets">
            <Button className="h-10 gap-2 bg-green-600 px-4 text-white hover:bg-green-500">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer un ticket
            </Button>
          </Link>
        </div>
      </section>

      <section
        aria-label="Indicateurs clés"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <Card
              key={indicator.label}
              className="border-slate-800 bg-[#111c30] shadow-sm transition-colors hover:border-slate-700"
            >
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-400">{indicator.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">
                    {indicator.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{indicator.detail}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${indicator.tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-slate-800 bg-[#111c30] shadow-sm">
          <CardHeader className="border-b border-slate-800/80 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-green-400" aria-hidden="true" />
              État du parc
            </CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Répartition des équipements enregistrés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            {totalEquipements > 0 ? (
              <div
                className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800"
                role="img"
                aria-label={`Répartition des ${totalEquipements} équipements par état`}
              >
                {equipmentStates.map((state) => (
                  <span
                    key={state.label}
                    className={`${state.color} h-full transition-[width] duration-300`}
                    style={{ width: `${percentage(state.value)}%` }}
                    title={`${state.label} : ${state.value}`}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                Aucun équipement n’est encore recensé.
              </p>
            )}
            <ul className="space-y-1">
              {equipmentStates.map((state) => (
                <li
                  key={state.label}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-slate-300">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${state.color}`} />
                    <span className="truncate">{state.label}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${state.text}`}>
                    {state.value}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/equipements"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-green-300 transition-colors hover:text-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              Consulter l’inventaire
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-[#111c30] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                <LifeBuoy className="h-4 w-4 text-green-400" aria-hidden="true" />
                Demandes récentes
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-400">
                Derniers tickets enregistrés
              </CardDescription>
            </div>
            <Link
              href="/dashboard/tickets"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-green-300 hover:text-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              Tout voir <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-300">Aucun ticket à afficher</p>
                <p className="mt-1 text-sm text-slate-500">
                  Les nouvelles demandes apparaîtront ici.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {recentTickets.map((ticket) => {
                  const status = STATUTS_TICKETS[ticket.statut];
                  const priority = PRIORITES_TICKETS[ticket.priorite];
                  return (
                    <li key={ticket.id} className="px-5 py-4 transition-colors hover:bg-slate-900/30">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-xs font-semibold text-green-300">
                              {formatNumeroTicket(ticket.numero)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDateFr(ticket.created_at)}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-1 text-sm font-medium text-slate-100">
                            {ticket.description}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {ticket.demandeur_nom || "Demandeur non renseigné"}
                            {ticket.service_nom ? ` · ${ticket.service_nom}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {priority && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${priority.badgeClass}`}>
                              {priority.label}
                            </span>
                          )}
                          {status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-label="Actions rapides" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/equipements"
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-800 bg-[#111c30] p-4 transition-colors hover:border-green-700/60 hover:bg-[#14243a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Laptop className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-100">Ajouter un équipement</span>
            <span className="mt-0.5 block text-xs text-slate-400">Compléter l’inventaire</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-green-300" aria-hidden="true" />
        </Link>
        <Link
          href="/dashboard/affectations"
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-800 bg-[#111c30] p-4 transition-colors hover:border-green-700/60 hover:bg-[#14243a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-100">Créer une affectation</span>
            <span className="mt-0.5 block text-xs text-slate-400">Attribuer du matériel</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-green-300" aria-hidden="true" />
        </Link>
        <div className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-800 bg-[#111c30] p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-100">Vue de synthèse</span>
            <span className="mt-0.5 block text-xs text-slate-400">
              {stats.totalEmployes} employés · {stats.totalServices} services
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-7" aria-label="Chargement du tableau de bord" aria-busy="true">
      <div className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-[#111c30]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-slate-800 bg-[#111c30]"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-slate-800 bg-[#111c30]" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-800 bg-[#111c30]" />
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
