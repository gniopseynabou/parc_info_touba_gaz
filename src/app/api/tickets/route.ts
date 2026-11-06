import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { computeTicketPriority } from "@/lib/priority";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const { searchParams } = new URL(req.url);
    const statut = searchParams.get("statut") ?? "tous";
    const priorite = searchParams.get("priorite") ?? "tous";
    const search = searchParams.get("search")?.trim() ?? "";

    let query = `
      SELECT 
        t.*,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        srv.nom as service_nom,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
        i.id as intervention_id,
        i.debut as intervention_debut,
        i.fin as intervention_fin,
        i.actions as intervention_actions,
        i.resultat as intervention_resultat
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      LEFT JOIN equipements e ON e.id = t.equipement_id
      LEFT JOIN interventions i ON i.ticket_id = t.id AND i.id = (
        SELECT id FROM interventions WHERE ticket_id = t.id ORDER BY id DESC LIMIT 1
      )
      WHERE 1=1
    `;
    const params: string[] = [];

    // RG13: Un employé ne peut consulter que ses propres tickets
    if (session.role === "employe") {
      query += ` AND t.demandeur_id = ?`;
      params.push(session.employe_id || session.id);
    }

    if (statut !== "tous") {
      query += ` AND t.statut = ?`;
      params.push(statut);
    }

    if (priorite !== "tous") {
      query += ` AND t.priorite = ?`;
      params.push(priorite);
    }

    if (search) {
      query += ` AND (t.description LIKE ? OR t.categorie LIKE ? OR emp.nom LIKE ? OR emp.prenom LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY t.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur GET tickets:", error);
    return NextResponse.json({ success: false, data: [], message: "Impossible de charger les tickets." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const contentType = req.headers.get("content-type") || "";
    let demandeur_id: string | null = null;
    let description: string = "";
    let categorie: string = "";
    let canal: string = "application";
    let equipement_id: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      demandeur_id = (formData.get("demandeur_id") as string) || null;
      description = (formData.get("description") as string) || "";
      categorie = (formData.get("categorie") as string) || "";
      canal = (formData.get("canal") as string) || "application";
      equipement_id = (formData.get("equipement_id") as string) || null;
    } else {
      const body = await req.json();
      demandeur_id = body.demandeur_id || null;
      description = body.description || "";
      categorie = body.categorie || "";
      canal = body.canal || "application";
      equipement_id = body.equipement_id || null;
    }

    // Si l'utilisateur connecté est un employé, le demandeur est obligatoirement lui-même
    if (session.role === "employe") {
      demandeur_id = session.employe_id || session.id;
      canal = "application";
    }

    if (!demandeur_id || !categorie) {
      return NextResponse.json(
        { success: false, message: "Demandeur et catégorie sont obligatoires." },
        { status: 400 }
      );
    }

    const cleanDescription = (description || "").trim();

    // Récupérer l'employé et son service
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, service_id, nom, prenom FROM employes WHERE id = ? OR user_id = ?`,
      [demandeur_id, demandeur_id]
    );

    if (empRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employé demandeur introuvable." },
        { status: 404 }
      );
    }

    const employe = empRows[0];
    const realEmployeId = employe.id;
    const service_id = employe.service_id || null;

    let equipementType: string | null = null;

    // Contrôle et sécurité sur l'équipement sélectionné (Item 8)
    if (equipement_id) {
      const [eqRows] = await pool.query<RowDataPacket[]>(
        `SELECT e.id, e.type, e.marque, e.modele, e.archive,
                a.employe_id as aff_employe_id, a.service_id as aff_service_id
         FROM equipements e
         LEFT JOIN affectations a ON a.equipement_id = e.id AND a.date_fin IS NULL
         WHERE e.id = ?`,
        [equipement_id]
      );

      if (eqRows.length === 0 || eqRows[0].archive === 1) {
        return NextResponse.json(
          { success: false, message: "L'équipement sélectionné est invalide ou archivé." },
          { status: 400 }
        );
      }

      const eq = eqRows[0];
      equipementType = eq.type;

      // Si l'utilisateur est un employé : vérifier qu'il est rattaché à cet équipement
      // (soit équipement personnel, soit équipement commun de son service)
      if (session.role === "employe") {
        const isPersonalEquipment = eq.aff_employe_id === realEmployeId;
        const isServiceEquipment = service_id && eq.aff_service_id === service_id;

        if (!isPersonalEquipment && !isServiceEquipment) {
          return NextResponse.json(
            {
              success: false,
              message: "Accès refusé : cet équipement n'est rattaché ni à votre compte ni aux matériels partagés de votre service.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Calcul automatique de la priorité côté serveur selon les règles métier
    // L'employé ne peut pas choisir la priorité, et le formulaire d'assistance ne propose plus de priorité
    const priorityResult = computeTicketPriority({
      categorie,
      description: cleanDescription,
      equipementType,
    });

    const finalPriority = priorityResult.priorite;
    const priorityExplication = priorityResult.explication;

    const id = `tck-${crypto.randomUUID().slice(0, 8)}`;
    const auteurCreation = session.employe_id || session.id;

    // Insertion sécurisée avec priorite_explication (avec fallback si colonne non encore migrée)
    try {
      await pool.query<ResultSetHeader>(
        `INSERT INTO tickets (id, demandeur_id, service_id, description, categorie, priorite, priorite_explication, canal, equipement_id, statut, cree_par)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'nouveau', ?)`,
        [
          id,
          realEmployeId,
          service_id,
          cleanDescription,
          categorie,
          finalPriority,
          priorityExplication,
          canal || "application",
          equipement_id || null,
          auteurCreation,
        ]
      );
    } catch (insertError: unknown) {
      const err = insertError as { code?: string };
      if (err.code === "ER_BAD_FIELD_ERROR") {
        // Fallback sans la colonne priorite_explication
        await pool.query<ResultSetHeader>(
          `INSERT INTO tickets (id, demandeur_id, service_id, description, categorie, priorite, canal, equipement_id, statut, cree_par)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'nouveau', ?)`,
          [
            id,
            realEmployeId,
            service_id,
            cleanDescription,
            categorie,
            finalPriority,
            canal || "application",
            equipement_id || null,
            auteurCreation,
          ]
        );
      } else {
        throw insertError;
      }
    }

    // Notification automatique aux administrateurs IT
    try {
      const demandeurNom = `${employe.prenom || ""} ${employe.nom || ""}`.trim() || "Un employé";
      const canalLabel = canal ? ` (${canal})` : "";
      const descSnippet = cleanDescription ? ` : "${cleanDescription.slice(0, 100)}${cleanDescription.length > 100 ? "..." : ""}"` : "";
      await notifyAdmins({
        ticketId: id,
        titre: `Nouvelle demande d'assistance${canalLabel}`,
        message: `${demandeurNom} a soumis une demande (${categorie})${descSnippet}`,
        type: "ticket_cree",
        excludeUserId: session.role === "admin" ? session.id : undefined,
      });
    } catch (notifErr) {
      console.error("Erreur notification admin:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Ticket enregistré avec succès.",
      id,
      priorite: finalPriority,
      priorite_explication: priorityExplication,
    });
  } catch (error: any) {
    console.error("Erreur POST tickets:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Erreur lors de la création du ticket.",
        errorDetail: process.env.NODE_ENV !== "production" ? String(error?.stack || error) : undefined,
      },
      { status: 500 }
    );
  }
}
