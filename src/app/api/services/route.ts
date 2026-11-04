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
    const archiveParam = searchParams.get("archive");
    const isArchive = archiveParam === "1" || archiveParam === "true";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.*,
        COUNT(DISTINCT e.id) as total_employes,
        COUNT(DISTINCT eq.id) as total_equipements
      FROM services s
      LEFT JOIN employes e ON e.service_id = s.id AND e.actif = 1
      LEFT JOIN affectations a ON a.date_fin IS NULL AND (
        a.service_id = s.id OR a.employe_id IN (
          SELECT service_emp.id FROM employes service_emp
          WHERE service_emp.service_id = s.id AND service_emp.actif = 1
        )
      )
      LEFT JOIN equipements eq ON eq.id = a.equipement_id AND eq.archive = 0
      WHERE s.archive = ?
      GROUP BY s.id
      ORDER BY s.nom ASC`,
      [isArchive ? 1 : 0]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET services:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les services." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const body = await req.json();
    const { nom, description } = body;

    if (!nom?.trim()) {
      return NextResponse.json({ success: false, message: "Le nom du service est requis." }, { status: 400 });
    }

    const id = `srv-${crypto.randomUUID().slice(0, 8)}`;
    await pool.query<ResultSetHeader>(
      `INSERT INTO services (id, nom, description, archive) VALUES (?, ?, ?, 0)`,
      [id, nom.trim(), description?.trim() || null]
    );

    return NextResponse.json({ success: true, message: "Service créé avec succès.", id });
  } catch (error: unknown) {
    console.error("Erreur POST services:", error);
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "Ce nom de service existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
