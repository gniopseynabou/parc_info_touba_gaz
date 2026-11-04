import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }
    const session = authResult.user;

    const { searchParams } = new URL(req.url);
    const requestedEmployeId = searchParams.get("employe_id");

    // Sécurité stricte : un collaborateur ne peut JAMAIS consulter les données d'un tiers
    let targetIdentifier: string | null = null;
    if (session.role === "employe") {
      targetIdentifier = session.employe_id || session.id;
    } else {
      // Pour l'administrateur, il peut consulter un employé spécifique ou son propre profil
      targetIdentifier = requestedEmployeId || session.employe_id || session.id;
    }

    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, message: "Identifiant d'employé requis." },
        { status: 400 }
      );
    }

    // Récupérer le profil employé rattaché (par id, user_id ou email)
    const [empRows] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, s.nom as service_nom 
       FROM employes e 
       LEFT JOIN services s ON s.id = e.service_id 
       WHERE e.id = ? OR e.user_id = ? OR (LOWER(e.email) = LOWER(?) AND e.email IS NOT NULL AND e.email != '')
       LIMIT 1`,
      [targetIdentifier, targetIdentifier, session.email || ""]
    );

    if (empRows.length === 0) {
      console.warn(`[GET /api/employe/me] Profil introuvable pour identifiant=${targetIdentifier}`);
      return NextResponse.json(
        { success: false, message: "Profil employé introuvable." },
        { status: 404 }
      );
    }

    const employe = empRows[0];
    const realEmployeId = employe.id;
    const serviceId = employe.service_id;

    console.log(`[GET /api/employe/me] Espace collaborateur chargé: employé=${realEmployeId} (${employe.prenom} ${employe.nom})`);

    // 1. Équipements personnels affectés directement à l'employé (affectation active)
    const [equipementsPerso] = await pool.query<RowDataPacket[]>(
      `SELECT e.*, a.id as affectation_id, a.date_debut as affectation_date_debut, a.commentaire as affectation_motif,
              'personnel' as type_affectation,
              NULL as service_nom
       FROM affectations a
       JOIN equipements e ON e.id = a.equipement_id
       WHERE a.employe_id = ? AND a.date_fin IS NULL AND e.archive = 0
       ORDER BY a.date_debut DESC`,
      [realEmployeId]
    );

    // 2. Équipements partagés affectés au service de l'employé (affectation active)
    let equipementsService: RowDataPacket[] = [];
    if (serviceId) {
      const [serviceEqRows] = await pool.query<RowDataPacket[]>(
        `SELECT e.*, a.id as affectation_id, a.date_debut as affectation_date_debut, a.commentaire as affectation_motif,
                'service_partage' as type_affectation,
                s.nom as service_nom
         FROM affectations a
         JOIN equipements e ON e.id = a.equipement_id
         LEFT JOIN services s ON s.id = a.service_id
         WHERE a.service_id = ? AND a.date_fin IS NULL AND e.archive = 0
         ORDER BY a.date_debut DESC`,
        [serviceId]
      );
      equipementsService = serviceEqRows;
    }

    // Normaliser l'état reforme vers hors_service
    const sanitizeEq = (list: RowDataPacket[]) =>
      list.map((eq) => ({
        ...eq,
        etat: eq.etat === "reforme" ? "hors_service" : eq.etat,
      }));

    const cleanPerso = sanitizeEq(equipementsPerso);
    const cleanService = sanitizeEq(equipementsService);
    const allEquipements = [...cleanPerso, ...cleanService];

    // 3. Tickets d'assistance créés par cet employé
    const [tickets] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
              CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
              i.actions as intervention_actions,
              i.resultat as intervention_resultat
       FROM tickets t
       LEFT JOIN equipements e ON e.id = t.equipement_id
       LEFT JOIN interventions i ON i.ticket_id = t.id
       WHERE t.demandeur_id = ?
       ORDER BY t.created_at DESC`,
      [realEmployeId]
    );

    // 4. Pièces jointes (avec gestion d'erreur défensive)
    if (tickets.length > 0) {
      try {
        const ticketIds = tickets.map((ticket) => ticket.id as string);
        const placeholders = ticketIds.map(() => "?").join(", ");
        const [attachments] = await pool.query<RowDataPacket[]>(
          `SELECT id, ticket_id, original_name, mime_type, size_bytes FROM ticket_attachments
           WHERE ticket_id IN (${placeholders}) ORDER BY created_at ASC`,
          ticketIds
        );
        const attachmentsByTicket = new Map<string, RowDataPacket[]>();
        for (const attachment of attachments) {
          const list = attachmentsByTicket.get(attachment.ticket_id) || [];
          list.push(attachment);
          attachmentsByTicket.set(attachment.ticket_id, list);
        }
        for (const ticket of tickets) {
          ticket.attachments = attachmentsByTicket.get(ticket.id) || [];
        }
      } catch (attError) {
        console.warn("[GET /api/employe/me] Avertissement récupération pièces jointes :", attError);
        for (const ticket of tickets) {
          ticket.attachments = [];
        }
      }
    }

    // Statistiques calculées
    const ticketsEnCours = tickets.filter((t) => ["nouveau", "en_cours", "en_attente"].includes(t.statut)).length;
    const ticketsResolus = tickets.filter((t) => ["resolu", "cloture"].includes(t.statut)).length;

    return NextResponse.json({
      success: true,
      data: {
        employe,
        stats: {
          totalTickets: tickets.length,
          ticketsEnCours,
          ticketsResolus,
          totalEquipementsPerso: cleanPerso.length,
          totalEquipementsService: cleanService.length,
        },
        equipements: allEquipements,
        equipements_personnels: cleanPerso,
        equipements_service: cleanService,
        tickets,
      },
    });
  } catch (error) {
    console.error("[GET /api/employe/me] Erreur interne :", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la récupération des données employé." }, { status: 500 });
  }
}
