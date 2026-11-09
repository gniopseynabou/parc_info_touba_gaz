import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { id } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.* FROM services s WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Service introuvable." }, { status: 404 });
    }

    const service = rows[0];

    // 1. Liste des employés rattachés au service
    const [employes] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, u.role as user_role 
       FROM employes e 
       LEFT JOIN utilisateurs u ON u.id = e.user_id 
       WHERE e.service_id = ? AND e.actif = 1 
       ORDER BY e.nom ASC, e.prenom ASC`,
      [id]
    );

    // 2. Équipements communs affectés directement au service (partagés)
    const [equipementsCommuns] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, a.date_debut as affectation_date_debut, a.commentaire as affectation_commentaire 
       FROM affectations a
       JOIN equipements e ON e.id = a.equipement_id
       WHERE a.service_id = ? AND a.date_fin IS NULL AND e.archive = 0
       ORDER BY e.code DESC`,
      [id]
    );

    // 3. Équipements affectés individuellement aux employés de ce service
    const [equipementsIndividuels] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, a.date_debut as affectation_date_debut, a.commentaire as affectation_commentaire,
              CONCAT(emp.prenom, ' ', emp.nom) as employe_nom,
              emp.id as employe_id
       FROM affectations a
       JOIN equipements e ON e.id = a.equipement_id
       JOIN employes emp ON emp.id = a.employe_id
       WHERE emp.service_id = ? AND a.date_fin IS NULL AND e.archive = 0
       ORDER BY emp.nom ASC, e.code DESC`,
      [id]
    );

    const sanitizeEq = (list: RowDataPacket[]) =>
      list.map((eq) => ({
        ...eq,
        etat: eq.etat === "reforme" ? "hors_service" : eq.etat,
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        employes,
        equipements_communs: sanitizeEq(equipementsCommuns),
        equipements_individuels: sanitizeEq(equipementsIndividuels),
        total_employes: employes.length,
        total_equipements_communs: equipementsCommuns.length,
        total_equipements_individuels: equipementsIndividuels.length,
        total_equipements: equipementsCommuns.length + equipementsIndividuels.length,
      },
    });
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
    const { nom, description, archive } = body;

    // Si on demande uniquement une modification du statut d'archivage (Désarchivage ou Archivage)
    if (typeof archive !== "undefined") {
      await pool.query<ResultSetHeader>(
        `UPDATE services SET archive = ? WHERE id = ?`,
        [archive ? 1 : 0, id]
      );
      const actionMsg = archive ? "Service archivé avec succès." : "Service désarchivé et réactivé avec succès.";
      return NextResponse.json({ success: true, message: actionMsg });
    }

    if (!nom || !nom.trim()) {
      return NextResponse.json({ success: false, message: "Le nom du service est requis." }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE services SET nom = ?, description = ? WHERE id = ?`,
      [nom.trim(), description?.trim() || null, id]
    );

    return NextResponse.json({ success: true, message: "Service mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur PUT service:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
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
    await pool.query<ResultSetHeader>(`UPDATE services SET archive = 1 WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Service archivé avec succès." });
  } catch (error) {
    console.error("Erreur DELETE service:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
