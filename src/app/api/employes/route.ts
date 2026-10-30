import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { hashPassword, requireAuth } from "@/lib/auth";


export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("service_id");
    const search = searchParams.get("search")?.trim() ?? "";
    const showInactive = searchParams.get("show_inactive") === "true";

    let query = `
      SELECT 
        e.*,
        s.nom as service_nom,
        u.role as user_role,
        u.email as user_email,
        u.actif as user_actif
      FROM employes e
      LEFT JOIN services s ON s.id = e.service_id
      LEFT JOIN utilisateurs u ON u.id = e.user_id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (!showInactive) {
      query += ` AND e.actif = 1`;
    }

    if (serviceId && serviceId !== "tous") {
      query += ` AND e.service_id = ?`;
      params.push(serviceId);
    }

    if (search) {
      query += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.email LIKE ? OR e.telephone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY e.nom ASC, e.prenom ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET employes:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les employés." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const body = await req.json();
    const { nom, prenom, email, telephone, service_id, creer_compte, role, password } = body;

    if (!nom?.trim() || !prenom?.trim()) {
      return NextResponse.json({ success: false, message: "Nom et prénom sont requis." }, { status: 400 });
    }

    const cleanEmail = email?.trim().toLowerCase() || null;
    let userId: string | null = null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Si on demande la création d'un compte utilisateur pour cet employé
      if (creer_compte) {
        if (!cleanEmail) {
          connection.release();
          return NextResponse.json(
            { success: false, message: "Une adresse e-mail professionnelle est obligatoire pour créer un compte d'accès." },
            { status: 400 }
          );
        }
        if (!password || password.length < 4) {
          connection.release();
          return NextResponse.json(
            { success: false, message: "Le mot de passe doit comporter au moins 4 caractères." },
            { status: 400 }
          );
        }

        // Vérifier si l'e-mail existe déjà dans utilisateurs
        const [existingUser] = await connection.query<RowDataPacket[]>(
          `SELECT id FROM utilisateurs WHERE LOWER(email) = ?`,
          [cleanEmail]
        );
        if (existingUser.length > 0) {
          connection.release();
          return NextResponse.json(
            { success: false, message: "Cet e-mail est déjà utilisé par un autre compte utilisateur." },
            { status: 409 }
          );
        }

        const assignedRole = role === "admin" ? "admin" : "employe";
        userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const pwdHash = await hashPassword(password);

        await connection.query<ResultSetHeader>(
          `INSERT INTO utilisateurs (id, email, password_hash, nom, prenom, role, actif)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [userId, cleanEmail, pwdHash, nom.trim(), prenom.trim(), assignedRole]
        );
      }

      const employeId = `emp-${crypto.randomUUID().slice(0, 8)}`;
      await connection.query<ResultSetHeader>(
        `INSERT INTO employes (id, nom, prenom, email, telephone, service_id, actif, user_id)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          employeId,
          nom.trim(),
          prenom.trim(),
          cleanEmail,
          telephone?.trim() || null,
          service_id || null,
          userId,
        ]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: creer_compte
          ? `Employé et compte ${role === "admin" ? "Administrateur" : "Employé"} créés avec succès !`
          : "Employé ajouté avec succès.",
        id: employeId,
        user_id: userId,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error: unknown) {
    console.error("Erreur POST employes:", error);
    const err = error as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "Cet e-mail est déjà attribué à un employé." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la création." }, { status: 500 });
  }
}
