import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.*,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        emp.email as demandeur_email,
        emp.telephone as demandeur_telephone,
        srv.nom as service_nom,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
        e.numero_serie as equipement_num_serie,
        i.id as intervention_id,
        i.debut as intervention_debut,
        i.fin as intervention_fin,
        i.actions as intervention_actions,
        i.resultat as intervention_resultat
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      LEFT JOIN equipements e ON e.id = t.equipement_id
      LEFT JOIN interventions i ON i.ticket_id = t.id
      WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Ticket introuvable." }, { status: 404 });
    }

    const ticket = rows[0];

    // RG13: Un employé ne peut consulter que ses propres tickets
    if (session.role === "employe" && ticket.demandeur_id !== (session.employe_id || session.id)) {
      return NextResponse.json(
        { success: false, message: "Accès refusé à ce ticket." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Erreur GET ticket id:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const { id } = await params;
    const body = await req.json();
    const { statut, intervention } = body;

    // Vérifier l'existence du ticket
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, statut, date_resolution, date_cloture FROM tickets WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Ticket introuvable." }, { status: 404 });
    }

    const currentTicket = existing[0];
    const allowedStatuts = ["nouveau", "en_cours", "en_attente", "resolu", "cloture"];

    if (statut && !allowedStatuts.includes(statut)) {
      return NextResponse.json(
        { success: false, message: `Statut invalide. Valeurs permises: ${allowedStatuts.join(", ")}` },
        { status: 400 }
      );
    }

    // Règle métier RG09/RG15 : Traçabilité des dates de résolution et clôture
    let date_resolution = currentTicket.date_resolution;
    let date_cloture = currentTicket.date_cloture;
    const nowSql = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (statut === "resolu" && !date_resolution) {
      date_resolution = nowSql;
    } else if (statut === "cloture") {
      if (!date_resolution) date_resolution = nowSql;
      date_cloture = nowSql;
    }

    if (statut) {
      await pool.query<ResultSetHeader>(
        `UPDATE tickets 
         SET statut = ?,
             date_resolution = ?,
             date_cloture = ?
         WHERE id = ?`,
        [statut, date_resolution, date_cloture, id]
      );
    }

    // Gestion de l'intervention (CT08: Un ticket = max 1 intervention, CT10: fin >= debut)
    if (intervention && intervention.actions?.trim()) {
      const debutStr = intervention.debut || nowSql;
      const finStr = intervention.fin || nowSql;

      if (new Date(finStr).getTime() < new Date(debutStr).getTime()) {
        return NextResponse.json(
          { success: false, message: "La date et heure de fin ne peuvent pas être antérieures au début." },
          { status: 400 }
        );
      }

      const intId = `int-${crypto.randomUUID().slice(0, 8)}`;
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
          intId,
          id,
          debutStr,
          finStr,
          intervention.actions.trim(),
          intervention.resultat?.trim() || null,
          auteurId,
        ]
      );
    }

    return NextResponse.json({ success: true, message: "Ticket mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur PUT ticket id:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
