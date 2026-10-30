import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { requireAuth } from "@/lib/auth";


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
    const { date_fin, commentaire } = body;

    const endDate = date_fin || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE affectations 
       SET date_fin = ?, 
           commentaire = COALESCE(?, commentaire)
       WHERE id = ?`,
      [endDate, commentaire || null, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Affectation introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Affectation clôturée avec succès." });
  } catch (error) {
    console.error("Erreur PUT affectation id:", error);
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

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM affectations WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Affectation introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Affectation supprimée." });
  } catch (error) {
    console.error("Erreur DELETE affectation id:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
