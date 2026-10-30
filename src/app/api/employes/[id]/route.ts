import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { hashPassword, requireAuth } from "@/lib/auth";


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
      `SELECT e.*, s.nom as service_nom, u.role as user_role, u.email as user_email, u.actif as user_actif
       FROM employes e 
       LEFT JOIN services s ON s.id = e.service_id 
       LEFT JOIN utilisateurs u ON u.id = e.user_id
       WHERE e.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Employé introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Erreur GET employe id:", error);
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
    const { nom, prenom, email, telephone, service_id, actif, creer_compte, role, password, compte_actif } = body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier si l'employé existe
      const [empRows] = await connection.query<RowDataPacket[]>(
        `SELECT e.*, u.id as existing_user_id FROM employes e LEFT JOIN utilisateurs u ON u.id = e.user_id WHERE e.id = ?`,
        [id]
      );

      if (empRows.length === 0) {
        connection.release();
        return NextResponse.json({ success: false, message: "Employé introuvable." }, { status: 404 });
      }

      const employe = empRows[0];
      const cleanEmail = email !== undefined ? (email?.trim()?.toLowerCase() || null) : employe.email;

      let userId = employe.user_id;

      // Création de compte si demandé et pas encore de compte
      if (creer_compte && !userId && cleanEmail) {
        if (!password || password.length < 4) {
          connection.release();
          return NextResponse.json(
            { success: false, message: "Le mot de passe doit comporter au moins 4 caractères." },
            { status: 400 }
          );
        }

        userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const pwdHash = await hashPassword(password);
        const userRole = role === "admin" ? "admin" : "employe";

        await connection.query<ResultSetHeader>(
          `INSERT INTO utilisateurs (id, email, password_hash, nom, prenom, role, actif)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [userId, cleanEmail, pwdHash, nom || employe.nom, prenom || employe.prenom, userRole]
        );
      } else if (userId) {
        // Mise à jour éventuelle du compte existant (statut actif, rôle ou mot de passe)
        if (password && password.length >= 4) {
          const pwdHash = await hashPassword(password);
          await connection.query<ResultSetHeader>(
            `UPDATE utilisateurs SET password_hash = ? WHERE id = ?`,
            [pwdHash, userId]
          );
        }
        if (compte_actif !== undefined) {
          await connection.query<ResultSetHeader>(
            `UPDATE utilisateurs SET actif = ? WHERE id = ?`,
            [compte_actif ? 1 : 0, userId]
          );
        }
        if (role && (role === "admin" || role === "employe")) {
          await connection.query<ResultSetHeader>(
            `UPDATE utilisateurs SET role = ? WHERE id = ?`,
            [role, userId]
          );
        }
        if (cleanEmail) {
          await connection.query<ResultSetHeader>(
            `UPDATE utilisateurs SET email = ?, nom = ?, prenom = ? WHERE id = ?`,
            [cleanEmail, nom || employe.nom, prenom || employe.prenom, userId]
          );
        }
      }

      await connection.query<ResultSetHeader>(
        `UPDATE employes 
         SET nom = COALESCE(?, nom),
             prenom = COALESCE(?, prenom),
             email = ?,
             telephone = ?,
             service_id = ?,
             actif = COALESCE(?, actif),
             user_id = COALESCE(?, user_id)
         WHERE id = ?`,
        [
          nom?.trim(),
          prenom?.trim(),
          cleanEmail,
          telephone !== undefined ? (telephone?.trim() || null) : employe.telephone,
          service_id !== undefined ? (service_id || null) : employe.service_id,
          actif !== undefined ? (actif ? 1 : 0) : null,
          userId,
          id,
        ]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ success: true, message: "Employé mis à jour avec succès." });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error: unknown) {
    console.error("Erreur PUT employe id:", error);
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "Cet e-mail est déjà utilisé." }, { status: 409 });
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

    // Vérifier si l'employé a des affectations actives
    const [affRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM affectations WHERE employe_id = ? AND date_fin IS NULL`,
      [id]
    );

    if (affRows[0]?.cnt > 0) {
      return NextResponse.json(
        { success: false, message: "Impossible de désactiver cet employé car il possède du matériel affecté actif." },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Désactivation logique de l'employé
      await connection.query<ResultSetHeader>(`UPDATE employes SET actif = 0 WHERE id = ?`, [id]);

      // Désactivation du compte utilisateur associé
      await connection.query<ResultSetHeader>(
        `UPDATE utilisateurs u
         JOIN employes e ON e.user_id = u.id
         SET u.actif = 0
         WHERE e.id = ?`,
        [id]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ success: true, message: "Employé et son compte désactivés avec succès." });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error("Erreur DELETE employe id:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}
