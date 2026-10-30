import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
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

    const { id } = await params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.*,
        CASE 
          WHEN a.employe_id IS NOT NULL THEN CONCAT(emp.prenom, ' ', emp.nom)
          WHEN a.service_id IS NOT NULL THEN srv.nom
          ELSE NULL
        END as affectation_actuelle,
        a.id as affectation_id,
        a.date_debut as affectation_date_debut
      FROM equipements e
      LEFT JOIN affectations a ON a.equipement_id = e.id AND a.date_fin IS NULL
      LEFT JOIN employes emp ON emp.id = a.employe_id
      LEFT JOIN services srv ON srv.id = a.service_id
      WHERE e.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Équipement non trouvé." }, { status: 404 });
    }

    // Récupérer l'historique des affectations
    const [historique] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        CONCAT(emp.prenom, ' ', emp.nom) as employe_nom,
        srv.nom as service_nom
      FROM affectations a
      LEFT JOIN employes emp ON emp.id = a.employe_id
      LEFT JOIN services srv ON srv.id = a.service_id
      WHERE a.equipement_id = ?
      ORDER BY a.date_debut DESC`,
      [id]
    );

    // Récupérer les tickets liés
    const [tickets] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.*,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      WHERE t.equipement_id = ?
      ORDER BY t.created_at DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...rows[0],
        historique,
        tickets,
      },
    });
  } catch (error) {
    console.error("Erreur GET equipement id:", error);
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

    const { id } = await params;
    const body = await req.json();
    const { type, marque, modele, numero_serie, date_achat, etat, localisation, description, archive } = body;

    await pool.query<ResultSetHeader>(
      `UPDATE equipements 
       SET type = COALESCE(?, type),
           marque = COALESCE(?, marque),
           modele = COALESCE(?, modele),
           numero_serie = COALESCE(?, numero_serie),
           date_achat = COALESCE(?, date_achat),
           etat = COALESCE(?, etat),
           localisation = COALESCE(?, localisation),
           description = COALESCE(?, description),
           archive = COALESCE(?, archive)
       WHERE id = ?`,
      [
        type !== undefined ? (type?.trim() || null) : null,
        marque !== undefined ? (marque?.trim() || null) : null,
        modele !== undefined ? (modele?.trim() || null) : null,
        numero_serie !== undefined ? (numero_serie?.trim() || null) : null,
        date_achat !== undefined ? (date_achat || null) : null,
        etat !== undefined ? etat : null,
        localisation !== undefined ? (localisation?.trim() || null) : null,
        description !== undefined ? (description?.trim() || null) : null,
        archive !== undefined ? (archive ? 1 : 0) : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Équipement mis à jour." });
  } catch (error) {
    console.error("Erreur PUT equipement:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { id } = await params;

    // Archivage soft delete
    await pool.query<ResultSetHeader>(`UPDATE equipements SET archive = 1 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Équipement archivé." });
  } catch (error) {
    console.error("Erreur DELETE equipement:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
