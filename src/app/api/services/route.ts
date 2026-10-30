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
        s.*,
        COUNT(DISTINCT e.id) as total_employes,
        COUNT(DISTINCT a.id) as total_equipements
      FROM services s
      LEFT JOIN employes e ON e.service_id = s.id AND e.actif = 1
      LEFT JOIN affectations a ON a.service_id = s.id AND a.date_fin IS NULL
      WHERE s.archive = 0
      GROUP BY s.id
      ORDER BY s.nom ASC
    `);

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
