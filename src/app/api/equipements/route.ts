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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const etat = searchParams.get("etat") ?? "tous";
    const archive = searchParams.get("archive") === "true";

    let query = `
      SELECT 
        e.*,
        CASE 
          WHEN a.employe_id IS NOT NULL THEN CONCAT(emp.prenom, ' ', emp.nom)
          WHEN a.service_id IS NOT NULL THEN srv.nom
          ELSE NULL
        END as affectation_actuelle
      FROM equipements e
      LEFT JOIN affectations a ON a.equipement_id = e.id AND a.date_fin IS NULL
      LEFT JOIN employes emp ON emp.id = a.employe_id
      LEFT JOIN services srv ON srv.id = a.service_id
      WHERE e.archive = ?
    `;
    const params: (string | number | boolean)[] = [archive ? 1 : 0];

    if (etat !== "tous") {
      query += ` AND e.etat = ?`;
      params.push(etat);
    }

    if (search) {
      query += ` AND (e.type LIKE ? OR e.marque LIKE ? OR e.modele LIKE ? OR e.numero_serie LIKE ? OR e.localisation LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY e.code DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET equipements:", error);
    return NextResponse.json(
      { success: false, message: "Impossible de récupérer les équipements." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const body = await req.json();
    const { type, marque, modele, numero_serie, date_achat, etat, localisation, description } = body;

    if (!type || !type.trim()) {
      return NextResponse.json({ success: false, message: "Le type est obligatoire." }, { status: 400 });
    }

    const id = `eq-${crypto.randomUUID().slice(0, 8)}`;
    await pool.query<ResultSetHeader>(
      `INSERT INTO equipements (id, type, marque, modele, numero_serie, date_achat, etat, localisation, description, archive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        type.trim(),
        marque?.trim() || null,
        modele?.trim() || null,
        numero_serie?.trim() || null,
        date_achat || null,
        etat || "en_service",
        localisation?.trim() || null,
        description?.trim() || null,
      ]
    );

    return NextResponse.json({ success: true, message: "Équipement ajouté avec succès.", id });
  } catch (error: unknown) {
    console.error("Erreur POST equipements:", error);
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "Ce numéro de série existe déjà dans le parc." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Erreur lors de la création de l'équipement." },
      { status: 500 }
    );
  }
}
