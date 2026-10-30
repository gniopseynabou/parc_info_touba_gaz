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
        a.*,
        e.code as equipement_code,
        e.type as equipement_type,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.numero_serie, 'S/N inconnu'), ')') as equipement_label,
        CONCAT(emp.prenom, ' ', emp.nom) as employe_nom,
        srv.nom as service_nom
      FROM affectations a
      JOIN equipements e ON e.id = a.equipement_id
      LEFT JOIN employes emp ON emp.id = a.employe_id
      LEFT JOIN services srv ON srv.id = a.service_id
      ORDER BY a.date_debut DESC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET affectations:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les affectations." }, { status: 500 });
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
    const { equipement_id, cible_type, cible_id, date_debut, commentaire } = body;

    if (!equipement_id || !cible_type || !cible_id) {
      return NextResponse.json(
        { success: false, message: "Équipement et bénéficiaire sont obligatoires." },
        { status: 400 }
      );
    }

    // Règle métier stricte (CT06) : soit employé, soit service
    const employe_id = cible_type === "employe" ? cible_id : null;
    const service_id = cible_type === "service" ? cible_id : null;

    if ((employe_id && service_id) || (!employe_id && !service_id)) {
      return NextResponse.json(
        { success: false, message: "Une affectation concerne soit un employé, soit un service, jamais les deux." },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clôturer l'affectation active précédente s'il y en avait une
      await connection.query<ResultSetHeader>(
        `UPDATE affectations SET date_fin = CURRENT_DATE() WHERE equipement_id = ? AND date_fin IS NULL`,
        [equipement_id]
      );

      const id = `aff-${crypto.randomUUID().slice(0, 8)}`;
      const auteurId = session.employe_id || session.id;

      await connection.query<ResultSetHeader>(
        `INSERT INTO affectations (id, equipement_id, employe_id, service_id, date_debut, date_fin, commentaire, auteur_id)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
        [
          id,
          equipement_id,
          employe_id,
          service_id,
          date_debut || new Date().toISOString().slice(0, 10),
          commentaire?.trim() || null,
          auteurId,
        ]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ success: true, message: "Affectation enregistrée avec succès.", id });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error("Erreur POST affectations:", error);
    return NextResponse.json({ success: false, message: "Erreur lors de l'enregistrement de l'affectation." }, { status: 500 });
  }
}
