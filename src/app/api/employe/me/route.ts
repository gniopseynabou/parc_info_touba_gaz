import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth";


export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const { searchParams } = new URL(req.url);
    let identifier = searchParams.get("employe_id");

    // Si employé régulier, il ne peut voir QUE son propre espace
    if (session.role === "employe") {
      identifier = session.employe_id || session.id;
    } else if (!identifier) {
      identifier = session.employe_id || session.id;
    }

    if (!identifier) {
      return NextResponse.json({ success: false, message: "Identifiant manquant." }, { status: 400 });
    }

    // Récupérer l'employé que ce soit par son ID employe (emp-...) ou son ID utilisateur (usr-...)
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, s.nom as service_nom 
       FROM employes e 
       LEFT JOIN services s ON s.id = e.service_id 
       WHERE e.id = ? OR e.user_id = ?`,
      [identifier, identifier]
    );

    if (empRows.length === 0) {
      return NextResponse.json({ success: false, message: "Employé introuvable." }, { status: 404 });
    }

    const employe = empRows[0];
    const realEmployeId = employe.id;

    // Récupérer les équipements actuellement affectés à cet employé
    const [equipements] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, a.date_debut as affectation_date_debut, a.commentaire as affectation_motif
       FROM affectations a
       JOIN equipements e ON e.id = a.equipement_id
       WHERE a.employe_id = ? AND a.date_fin IS NULL AND e.archive = 0
       ORDER BY a.date_debut DESC`,
      [realEmployeId]
    );

    // Récupérer les tickets d'assistance créés par cet employé
    const [tickets] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
              CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
              i.actions as intervention_actions,
              i.resultat as intervention_resultat
       FROM tickets t
       LEFT JOIN equipements e ON e.id = t.equipement_id
       LEFT JOIN interventions i ON i.ticket_id = t.id
       WHERE t.demandeur_id = ?
       ORDER BY t.created_at DESC`,
      [realEmployeId]
    );

    return NextResponse.json({
      success: true,
      data: {
        employe,
        equipements,
        tickets,
      },
    });
  } catch (error) {
    console.error("Erreur GET employe/me:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
