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
        s.*,
        COUNT(DISTINCT e.id) as total_employes,
        COUNT(DISTINCT a.id) as total_equipements
       FROM services s
       LEFT JOIN employes e ON e.service_id = s.id AND e.actif = 1
       LEFT JOIN affectations a ON a.service_id = s.id AND a.date_fin IS NULL
       WHERE s.id = ?
       GROUP BY s.id`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Service introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Erreur GET service id:", error);
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
    const { nom, description } = body;

    await pool.query<ResultSetHeader>(
      `UPDATE services 
       SET nom = COALESCE(?, nom),
           description = COALESCE(?, description)
       WHERE id = ?`,
      [nom?.trim(), description !== undefined ? description?.trim() : null, id]
    );

    return NextResponse.json({ success: true, message: "Service mis à jour avec succès." });
  } catch (error: unknown) {
    console.error("Erreur PUT service id:", error);
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "Ce nom de service existe déjà." }, { status: 409 });
    }
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

    // Vérifier si des employés actifs sont rattachés
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM employes WHERE service_id = ? AND actif = 1`,
      [id]
    );
    if (empRows[0]?.cnt > 0) {
      return NextResponse.json(
        { success: false, message: "Impossible de supprimer ce service : des employés actifs y sont rattachés." },
        { status: 400 }
      );
    }

    // Vérifier si des affectations actives sont rattachées
    const [affRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM affectations WHERE service_id = ? AND date_fin IS NULL`,
      [id]
    );
    if (affRows[0]?.cnt > 0) {
      return NextResponse.json(
        { success: false, message: "Impossible de supprimer ce service : du matériel y est actuellement affecté." },
        { status: 400 }
      );
    }

    // Archivage soft delete
    await pool.query<ResultSetHeader>(`UPDATE services SET archive = 1 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Service archivé avec succès." });
  } catch (error) {
    console.error("Erreur DELETE service id:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
