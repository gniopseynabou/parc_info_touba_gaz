import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth";


const STATS_QUERY = `
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
`;

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const [[row]] = await pool.query<RowDataPacket[]>(STATS_QUERY);

    const stats = {
      totalEquipements: Number(row?.totalEquipements ?? 0),
      equipementsEnService: Number(row?.equipementsEnService ?? 0),
      equipementsEnPanne: Number(row?.equipementsEnPanne ?? 0),
      equipementsEnMaintenance: Number(row?.equipementsEnMaintenance ?? 0),
      equipementsReformes: Number(row?.equipementsReformes ?? 0),
      totalTickets: Number(row?.totalTickets ?? 0),
      ticketsNouveaux: Number(row?.ticketsNouveaux ?? 0),
      ticketsEnCours: Number(row?.ticketsEnCours ?? 0),
      ticketsEnAttente: Number(row?.ticketsEnAttente ?? 0),
      ticketsResolus: Number(row?.ticketsResolus ?? 0),
      ticketsClotures: Number(row?.ticketsClotures ?? 0),
      totalEmployes: Number(row?.totalEmployes ?? 0),
      totalServices: Number(row?.totalServices ?? 0),
      totalAffectationsActives: Number(row?.totalAffectationsActives ?? 0),
    };

    return NextResponse.json({ success: true, stats }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Erreur Dashboard Stats:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors du calcul des statistiques." },
      { status: 500 }
    );
  }
}
