import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";


export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        i.*,
        t.numero as ticket_numero,
        t.description as ticket_description,
        t.statut as ticket_statut,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        srv.nom as service_nom
      FROM interventions i
      JOIN tickets t ON t.id = i.ticket_id
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      ORDER BY i.created_at DESC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET interventions:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les interventions." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const body = await req.json();
    const { ticket_id, debut, fin, actions, resultat } = body;

    if (!ticket_id || !actions?.trim()) {
      return NextResponse.json(
        { success: false, message: "Le ticket et la description des actions menées sont obligatoires." },
        { status: 400 }
      );
    }

    const nowSql = new Date().toISOString().slice(0, 19).replace("T", " ");
    const debutStr = debut || nowSql;
    const finStr = fin || nowSql;

    // CT10: Date fin >= Date debut
    if (new Date(finStr).getTime() < new Date(debutStr).getTime()) {
      return NextResponse.json(
        { success: false, message: "La date et heure de fin ne peuvent pas être antérieures au début." },
        { status: 400 }
      );
    }

    const id = `int-${crypto.randomUUID().slice(0, 8)}`;
    const auteurId = session.employe_id || session.id;

    await pool.query<ResultSetHeader>(
      `INSERT INTO interventions (id, ticket_id, debut, fin, actions, resultat, auteur_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         debut = VALUES(debut),
         fin = VALUES(fin),
         actions = VALUES(actions),
         resultat = VALUES(resultat),
         auteur_id = VALUES(auteur_id)`,
      [
        id,
        ticket_id,
        debutStr,
        finStr,
        actions.trim(),
        resultat?.trim() || null,
        auteurId,
      ]
    );

    // Mettre à jour le statut du ticket en résolu si le résultat indique succès
    await pool.query<ResultSetHeader>(
      `UPDATE tickets SET statut = 'resolu', date_resolution = CURRENT_TIMESTAMP WHERE id = ? AND statut IN ('nouveau', 'en_cours', 'en_attente')`,
      [ticket_id]
    );

    return NextResponse.json({ success: true, message: "Intervention enregistrée avec succès.", id });
  } catch (error) {
    console.error("Erreur POST intervention:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de l'enregistrement de l'intervention." }, { status: 500 });
  }
}
