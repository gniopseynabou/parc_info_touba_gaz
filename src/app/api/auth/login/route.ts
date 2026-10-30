import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Veuillez renseigner votre e-mail et votre mot de passe." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Chercher dans la table utilisateurs (comptes avec mot de passe et rôle défini)
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.email, u.password_hash, u.nom, u.prenom, u.role, u.actif,
              e.id as employe_id, e.service_id, s.nom as service_nom
       FROM utilisateurs u
       LEFT JOIN employes e ON e.user_id = u.id
       LEFT JOIN services s ON s.id = e.service_id
       WHERE LOWER(u.email) = ? AND u.actif = 1`,
      [cleanEmail]
    );

    if (users.length > 0) {
      const user = users[0];

      // Vérifier le mot de passe
      const isPasswordValid = verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Identifiants invalides ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      const redirectTo = user.role === "admin" ? "/dashboard" : "/espace-employe";
      const nomComplet = `${user.prenom} ${user.nom}`.trim();

      const token = createSessionToken({
        id: user.id,
        email: user.email,
        nom: nomComplet,
        role: user.role,
        employe_id: user.employe_id || null,
        service_nom: user.service_nom || null,
      });

      const response = NextResponse.json({
        success: true,
        message: "Connexion réussie.",
        user: {
          id: user.id,
          email: user.email,
          nom: nomComplet,
          role: user.role,
          employe_id: user.employe_id,
          service_nom: user.service_nom,
        },
        redirectTo,
      });

      // Déposer le cookie de session sécurisé (httpOnly)
      response.cookies.set(SESSION_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_DURATION_SECONDS,
      });

      return response;
    }

    // 2. Si l'utilisateur n'est pas dans la table utilisateurs mais dans la table employes
    const [emp] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.nom, e.prenom, e.email, e.user_id
       FROM employes e 
       WHERE LOWER(e.email) = ? AND e.actif = 1`,
      [cleanEmail]
    );

    if (emp.length > 0) {
      // L'employé existe mais n'a pas de compte utilisateur actif -> Refus strict de connexion
      return NextResponse.json(
        {
          success: false,
          message: "Aucun compte d'accès actif n'est associé à cet employé. Veuillez vous rapprocher de l'Administrateur IT.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Aucun compte trouvé avec cette adresse e-mail." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erreur API login:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la connexion." },
      { status: 500 }
    );
  }
}
