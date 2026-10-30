import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth";


export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(req, ["admin"]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const dateDebut = searchParams.get("date_debut"); // ex: 2026-10-01
    const dateFin = searchParams.get("date_fin");     // ex: 2026-10-31
    const serviceId = searchParams.get("service_id");
    const statut = searchParams.get("statut");

    // 1. Récupération des interventions sur la période
    let queryInterventions = `
      SELECT 
        i.id as intervention_id,
        i.debut,
        i.fin,
        TIMESTAMPDIFF(MINUTE, i.debut, i.fin) as duree_minutes,
        i.actions,
        i.resultat,
        CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, 'Administrateur IT')) as technicien_nom,
        t.id as ticket_id,
        t.numero as ticket_numero,
        t.description as ticket_description,
        t.categorie as ticket_categorie,
        t.priorite as ticket_priorite,
        t.statut as ticket_statut,
        t.canal as ticket_canal,
        t.created_at as ticket_date_creation,
        t.date_resolution as ticket_date_resolution,
        t.date_cloture as ticket_date_cloture,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        srv.nom as service_nom,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
        e.numero_serie as equipement_num_serie
      FROM interventions i
      JOIN tickets t ON t.id = i.ticket_id
      LEFT JOIN utilisateurs u ON u.id = i.auteur_id
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      LEFT JOIN equipements e ON e.id = t.equipement_id
      WHERE 1=1
    `;
    const paramsInt: string[] = [];

    if (dateDebut) {
      queryInterventions += ` AND DATE(i.debut) >= ?`;
      paramsInt.push(dateDebut);
    }
    if (dateFin) {
      queryInterventions += ` AND DATE(i.debut) <= ?`;
      paramsInt.push(dateFin);
    }
    if (serviceId && serviceId !== "tous") {
      queryInterventions += ` AND t.service_id = ?`;
      paramsInt.push(serviceId);
    }
    if (statut && statut !== "tous") {
      queryInterventions += ` AND t.statut = ?`;
      paramsInt.push(statut);
    }

    queryInterventions += ` ORDER BY i.debut DESC`;
    const [interventions] = await pool.query<RowDataPacket[]>(queryInterventions, paramsInt);

    // 2. Récupération des incidents (tickets) sur la période
    let queryTickets = `
      SELECT 
        t.*,
        CONCAT(emp.prenom, ' ', emp.nom) as demandeur_nom,
        srv.nom as service_nom,
        CONCAT(COALESCE(e.marque, ''), ' ', COALESCE(e.modele, ''), ' (', COALESCE(e.type, ''), ')') as equipement_label,
        e.numero_serie as equipement_num_serie,
        i.id as intervention_id,
        i.debut as intervention_debut,
        i.fin as intervention_fin,
        TIMESTAMPDIFF(MINUTE, i.debut, i.fin) as duree_minutes,
        i.actions as intervention_actions,
        i.resultat as intervention_resultat,
        CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, 'IT')) as technicien_nom
      FROM tickets t
      LEFT JOIN employes emp ON emp.id = t.demandeur_id
      LEFT JOIN services srv ON srv.id = t.service_id
      LEFT JOIN equipements e ON e.id = t.equipement_id
      LEFT JOIN interventions i ON i.ticket_id = t.id
      LEFT JOIN utilisateurs u ON u.id = i.auteur_id
      WHERE 1=1
    `;
    const paramsTck: string[] = [];

    if (dateDebut) {
      queryTickets += ` AND DATE(t.created_at) >= ?`;
      paramsTck.push(dateDebut);
    }
    if (dateFin) {
      queryTickets += ` AND DATE(t.created_at) <= ?`;
      paramsTck.push(dateFin);
    }
    if (serviceId && serviceId !== "tous") {
      queryTickets += ` AND t.service_id = ?`;
      paramsTck.push(serviceId);
    }
    if (statut && statut !== "tous") {
      queryTickets += ` AND t.statut = ?`;
      paramsTck.push(statut);
    }

    queryTickets += ` ORDER BY t.created_at DESC`;
    const [tickets] = await pool.query<RowDataPacket[]>(queryTickets, paramsTck);

    // 3. Synthèse chiffrée de la période
    const totalIncidents = tickets.length;
    const totalInterventions = interventions.length;
    const statutsCount: Record<string, number> = {
      nouveau: 0,
      en_cours: 0,
      en_attente: 0,
      resolu: 0,
      cloture: 0,
    };
    const prioritesCount: Record<string, number> = {
      basse: 0,
      normale: 0,
      haute: 0,
      critique: 0,
    };
    let dureeTotaleMinutes = 0;

    for (const t of tickets) {
      if (t.statut && statutsCount[t.statut] !== undefined) {
        statutsCount[t.statut]++;
      }
      if (t.priorite && prioritesCount[t.priorite] !== undefined) {
        prioritesCount[t.priorite]++;
      }
    }

    for (const intItem of interventions) {
      if (intItem.duree_minutes && intItem.duree_minutes > 0) {
        dureeTotaleMinutes += Number(intItem.duree_minutes);
      }
    }

    const tauxResolution = totalIncidents > 0
      ? Math.round(((statutsCount.resolu + statutsCount.cloture) / totalIncidents) * 100)
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        filtres: {
          date_debut: dateDebut || null,
          date_fin: dateFin || null,
          service_id: serviceId || "tous",
          statut: statut || "tous",
        },
        synthese: {
          totalIncidents,
          totalInterventions,
          statutsCount,
          prioritesCount,
          dureeTotaleMinutes,
          tauxResolution,
        },
        interventions,
        tickets,
      },
    });
  } catch (error) {
    console.error("Erreur GET rapports:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la génération du rapport." },
      { status: 500 }
    );
  }
}
