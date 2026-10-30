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
    const session = authResult.user;

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut") ?? "tous";
    const priorite = searchParams.get("priorite") ?? "tous";
    const search = searchParams.get("search")?.trim() ?? "";

    let query = `
      SELECT 
        t.*,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        srv.nom as service_nom,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
        i.id as intervention_id,
        i.debut as intervention_debut,
        i.fin as intervention_fin,
        i.actions as intervention_actions,
        i.resultat as intervention_resultat
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      LEFT JOIN equipements e ON e.id = t.equipement_id
      LEFT JOIN interventions i ON i.ticket_id = t.id AND i.id = (
        SELECT id FROM interventions WHERE ticket_id = t.id ORDER BY id DESC LIMIT 1
      )
      WHERE 1=1
    `;
    const params: string[] = [];

    // RG13: Un employé ne peut consulter que ses propres tickets
    if (session.role === "employe") {
      query += ` AND t.demandeur_id = ?`;
      params.push(session.employe_id || session.id);
    }

    if (statut !== "tous") {
      query += ` AND t.statut = ?`;
      params.push(statut);
    }

    if (priorite !== "tous") {
      query += ` AND t.priorite = ?`;
      params.push(priorite);
    }

    if (search) {
      query += ` AND (t.description LIKE ? OR t.categorie LIKE ? OR emp.nom LIKE ? OR emp.prenom LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY t.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET tickets:", error);
    return NextResponse.json({ success: false, data: [], message: "Impossible de charger les tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const body = await req.json();
    let { demandeur_id, description, categorie, priorite, canal, equipement_id } = body;

    // Si l'utilisateur connecté est un employé, il ne peut créer un ticket que pour lui-même
    if (session.role === "employe") {
      demandeur_id = session.employe_id || session.id;
      canal = "application";
    }

    if (!demandeur_id || !description?.trim() || !categorie) {
      return NextResponse.json(
        { success: false, message: "Demandeur, description et catégorie sont obligatoires." },
        { status: 400 }
      );
    }

    // Récupérer automatiquement le service de l'employé demandeur
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT service_id FROM employes WHERE id = ?`,
      [demandeur_id]
    );
    const service_id = empRows[0]?.service_id || null;

    const id = `tck-${crypto.randomUUID().slice(0, 8)}`;
    const auteurCreation = session.employe_id || session.id;

    await pool.query<ResultSetHeader>(
      `INSERT INTO tickets (id, demandeur_id, service_id, description, categorie, priorite, canal, equipement_id, statut, cree_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'nouveau', ?)`,
      [
        id,
        demandeur_id,
        service_id,
        description.trim(),
        categorie,
        priorite || "normale",
        canal || "application",
        equipement_id || null,
        auteurCreation,
      ]
    );

    return NextResponse.json({ success: true, message: "Ticket enregistré avec succès.", id });
  } catch (error) {
    console.error("Erreur POST tickets:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la création du ticket." }, { status: 500 });
  }
}
