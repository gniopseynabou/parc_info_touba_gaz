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
  Archive,
  ServerCrash,
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

async function getDashboardData(): Promise<{
  success: boolean;
  errorMessage?: string;
  stats?: DashboardStats;
  recentTickets?: RecentTicket[];
  equipementsParService?: { service_nom: string; total_equipements: number }[];
  snapshotTime?: string;
}> {
  try {
    const [statsRows] = await pool.query<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM equipements WHERE archive = 0) as totalEquipements,
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
      LIMIT 6
    `);

    // Répartition des équipements affectés par service (soit directement au service, soit via les employés du service)
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

    const now = new Date();
    const snapshotTime = now.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) + " à " + now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      success: true,
      stats,
      recentTickets: ticketRows.map((ticket) => ({
        ...ticket,
        demandeur_nom: ticket.demandeur_nom ?? undefined,
        service_nom: ticket.service_nom ?? undefined,
      })),
      equipementsParService: serviceRows.map((r) => ({
        service_nom: r.service_nom,
        total_equipements: Number(r.total_equipements || 0),
      })),
      snapshotTime,
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Erreur Dashboard MySQL:", error.message);
    return {
      success: false,
      errorMessage: `Erreur de connexion à la base de données MySQL : ${error.message}. Les données ne peuvent pas être chargées.`,
    };
  }
}

async function DashboardContent() {
  const result = await getDashboardData();

  if (!result.success || !result.stats) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50/70 p-8 shadow-xs text-center max-w-2xl mx-auto my-12">
          <ServerCrash className="h-12 w-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Échec de communication avec MySQL</h2>
          <p className="text-sm text-rose-700">
            {result.errorMessage || "Impossible de contacter le serveur de base de données."}
          </p>
          <p className="text-xs text-slate-500">
            Veuillez vérifier que le serveur MySQL (XAMPP/MariaDB port 3306) est démarré et que les accès définis dans <code className="text-slate-700 font-mono">.env.local</code> sont valides.
          </p>
          <div className="pt-4 flex justify-center">
            <RefreshButton />
          </div>
        </section>
      </div>
    );
  }

  const { stats, recentTickets = [], equipementsParService = [], snapshotTime } = result;

  // Calculs :
  const equipementsActifs = Math.max(0, stats.totalEquipements - stats.equipementsReformes);
  
  const tauxDisponibilite = equipementsActifs > 0
    ? Math.round((stats.equipementsEnService / equipementsActifs) * 100)
    : 100;

  const ticketsOuverts = stats.ticketsNouveaux + stats.ticketsEnCours + stats.ticketsEnAttente;
  const ticketsResolusEnAttenteCloture = stats.ticketsResolus;

  return (
    <div className="space-y-7">
      {/* En-tête éditorial Touba Gaz */}
      <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
            Supervision du parc informatique · Touba Gaz SA
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tableau de bord de gestion
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            État du matériel, inventaire, disponibilité opérationnelle et suivi des demandes d'assistance.
          </p>
          {snapshotTime && (
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Données actualisées le {snapshotTime}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <RefreshButton />
          <Link href="/dashboard/tickets">
            <Button className="h-10 gap-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-xs cursor-pointer">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouveau ticket
            </Button>
          </Link>
        </div>
      </section>

      {/* Bloc 1 : Indicateurs clés du Parc Informatique */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Parc informatique & Disponibilité
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parc Actif</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {equipementsActifs}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stats.totalEquipements} recensés au total</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 bg-slate-100">
                <Laptop className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En service</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 tabular-nums">
                  {stats.equipementsEnService}
                </p>
                <p className="mt-1 text-xs text-slate-500">{tauxDisponibilite} % de disponibilité</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200/50">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En panne</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-rose-600 tabular-nums">
                  {stats.equipementsEnPanne}
                </p>
                <p className="mt-1 text-xs text-slate-500">Diagnostic requis</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-rose-600 bg-rose-50 ring-1 ring-rose-200/50">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En maintenance</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600 tabular-nums">
                  {stats.equipementsEnMaintenance}
                </p>
                <p className="mt-1 text-xs text-slate-500">Intervention en atelier</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-amber-600 bg-amber-50 ring-1 ring-amber-200/50">
                <Wrench className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Réformés</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-500 tabular-nums">
                  {stats.equipementsReformes}
                </p>
                <p className="mt-1 text-xs text-slate-500">Amortis / hors circuit</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 bg-slate-100">
                <Archive className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloc 2 : Demandes d'assistance (Tickets & Statuts) */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Demandes d'assistance & Cycle de vie
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nouveaux</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-sky-600 tabular-nums">
                  {stats.ticketsNouveaux}
                </p>
                <p className="mt-1 text-xs text-slate-500">À prendre en charge</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sky-600 bg-sky-50 ring-1 ring-sky-200/50">
                <LifeBuoy className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En cours</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600 tabular-nums">
                  {stats.ticketsEnCours}
                </p>
                <p className="mt-1 text-xs text-slate-500">Traitement IT actif</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-amber-600 bg-amber-50 ring-1 ring-amber-200/50">
                <Wrench className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En attente</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-purple-600 tabular-nums">
                  {stats.ticketsEnAttente}
                </p>
                <p className="mt-1 text-xs text-slate-500">Pièce ou retour employé</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-purple-600 bg-purple-50 ring-1 ring-purple-200/50">
                <Clock className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Résolus</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 tabular-nums">
                  {ticketsResolusEnAttenteCloture}
                </p>
                <p className="mt-1 text-xs text-slate-500">En attente de clôture</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200/50">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clôturés</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-500 tabular-nums">
                  {stats.ticketsClotures}
                </p>
                <p className="mt-1 text-xs text-slate-500">Vérifiés et archivés</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 bg-slate-100">
                <Archive className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloc 3 : Deux colonnes d'analyse détaillée */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Ventilation des équipements par Service */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Équipements par service
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Ventilation du matériel affecté par direction de Touba Gaz
              </CardDescription>
            </div>
            <Link
              href="/dashboard/affectations"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Affectations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            {equipementsParService.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Aucun service actif recensé.
              </p>
            ) : (
              <div className="space-y-3.5">
                {equipementsParService.map((srv) => {
                  const maxEq = Math.max(...equipementsParService.map((s) => s.total_equipements), 1);
                  const pct = Math.round((srv.total_equipements / maxEq) * 100);
                  return (
                    <div key={srv.service_nom} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{srv.service_nom}</span>
                        <span className="font-semibold text-emerald-700 tabular-nums">
                          {srv.total_equipements} <span className="text-slate-500 font-normal">équip.</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Derniers tickets enregistrés avec statut */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                Derniers signalements d'assistance
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm text-slate-500">
                {ticketsOuverts} demandes en cours de traitement
              </CardDescription>
            </div>
            <Link
              href="/dashboard/tickets"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Tous les tickets <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTickets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">Aucun ticket enregistré</p>
                <p className="mt-1 text-xs text-slate-500">
                  Les nouveaux signalements apparaîtront ici.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => {
                  const status = STATUTS_TICKETS[ticket.statut];
                  const priority = PRIORITES_TICKETS[ticket.priorite];
                  return (
                    <li key={ticket.id} className="px-5 py-3.5 transition-colors hover:bg-slate-50/70">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-xs font-semibold text-emerald-700">
                              {formatNumeroTicket(ticket.numero)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDateFr(ticket.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900">
                            {ticket.description}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {ticket.demandeur_nom || "Demandeur inconnu"}
                            {ticket.service_nom ? ` · ${ticket.service_nom}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {priority && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${priority.badgeClass}`}>
                              {priority.label}
                            </span>
                          )}
                          {status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badgeClass}`}>
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

      {/* Raccourcis métier rapides */}
      <section aria-label="Raccourcis de gestion" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/equipements"
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
            <Laptop className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">Gérer le parc</span>
            <span className="mt-0.5 block text-xs text-slate-500">{stats.totalEquipements} équipements enregistrés</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
        </Link>

        <Link
          href="/dashboard/affectations"
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
            <Share2 className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">Affectations du matériel</span>
            <span className="mt-0.5 block text-xs text-slate-500">{stats.totalAffectationsActives} attributions en cours</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
        </Link>

        <Link
          href="/dashboard/rapports"
          className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
            <TrendingUp className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">Rapports d'activité</span>
            <span className="mt-0.5 block text-xs text-slate-500">Édition et vue imprimable</span>
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
        </Link>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-7" aria-label="Chargement du tableau de bord" aria-busy="true">
      <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
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
