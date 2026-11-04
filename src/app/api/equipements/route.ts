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
    const type = searchParams.get("type") ?? "tous";
    const service_id = searchParams.get("service_id") ?? "tous";
    const disponible = searchParams.get("disponible") === "true";
    const archive = searchParams.get("archive") === "true";

    let query = `
      SELECT 
        e.*,
        a.id as affectation_id,
        a.employe_id,
        a.service_id as direct_service_id,
        COALESCE(a.service_id, emp.service_id) as service_id,
        COALESCE(srv_direct.nom, srv_emp.nom) as service_nom,
        CONCAT(emp.prenom, ' ', emp.nom) as employe_nom,
        CASE 
          WHEN a.employe_id IS NOT NULL THEN CONCAT(emp.prenom, ' ', emp.nom)
          WHEN a.service_id IS NOT NULL THEN CONCAT('Service : ', srv_direct.nom)
          ELSE NULL
        END as affectation_actuelle
      FROM equipements e
      LEFT JOIN affectations a ON a.equipement_id = e.id AND a.date_fin IS NULL
      LEFT JOIN employes emp ON emp.id = a.employe_id
      LEFT JOIN services srv_direct ON srv_direct.id = a.service_id
      LEFT JOIN services srv_emp ON srv_emp.id = emp.service_id
      WHERE e.archive = ?
    `;
    const params: (string | number | boolean)[] = [archive ? 1 : 0];

    // Filtre équipement disponible pour nouvelle affectation
    if (disponible) {
      query += ` AND a.id IS NULL AND e.etat NOT IN ('hors_service', 'reforme')`;
    }

    // Filtre par état
    if (etat !== "tous") {
      if (etat === "hors_service" || etat === "reforme") {
        query += ` AND (e.etat = 'hors_service' OR e.etat = 'reforme')`;
      } else {
        query += ` AND e.etat = ?`;
        params.push(etat);
      }
    }

    // Filtre par type
    if (type !== "tous") {
      query += ` AND e.type = ?`;
      params.push(type);
    }

    // Filtre par service (directement affecté au service OU via un employé de ce service, ou non affecté)
    if (service_id === "non_affectes") {
      query += ` AND a.id IS NULL`;
    } else if (service_id !== "tous" && service_id) {
      query += ` AND (a.service_id = ? OR emp.service_id = ?)`;
      params.push(service_id, service_id);
    }

    // Recherche plein texte
    if (search) {
      query += ` AND (e.type LIKE ? OR e.marque LIKE ? OR e.modele LIKE ? OR e.numero_serie LIKE ? OR e.localisation LIKE ? OR emp.nom LIKE ? OR emp.prenom LIKE ? OR srv_direct.nom LIKE ? OR srv_emp.nom LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s, s, s, s);
    }

    query += ` ORDER BY e.code DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Normaliser l'état 'reforme' vers 'hors_service' pour le frontend
    const sanitizedRows = rows.map((row) => ({
      ...row,
      etat: row.etat === "reforme" ? "hors_service" : row.etat,
    }));

    return NextResponse.json({ success: true, data: sanitizedRows });
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
    let { type, marque, modele, numero_serie, date_achat, etat, localisation, description, photo } = body;

    if (!type || !type.trim()) {
      return NextResponse.json({ success: false, message: "Le type est obligatoire." }, { status: 400 });
    }

    if (etat === "reforme") {
      etat = "hors_service";
    }

    const id = `eq-${crypto.randomUUID().slice(0, 8)}`;
    await pool.query<ResultSetHeader>(
      `INSERT INTO equipements (id, type, marque, modele, numero_serie, date_achat, etat, localisation, description, photo, archive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
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
        photo?.trim() || null,
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
    return NextResponse.json({ success: false, message: "Erreur serveur lors de l'enregistrement." }, { status: 500 });
  }
}
