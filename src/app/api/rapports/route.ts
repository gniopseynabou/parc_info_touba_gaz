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
    const employeId = searchParams.get("employe_id");
    const typeEquipement = searchParams.get("type_equipement");
    const etatEquipement = searchParams.get("etat_equipement");
    const statut = searchParams.get("statut");
    const priorite = searchParams.get("priorite");
    const categorie = searchParams.get("categorie");

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
    if (employeId && employeId !== "tous") {
      queryInterventions += ` AND t.demandeur_id = ?`;
      paramsInt.push(employeId);
    }
    if (typeEquipement && typeEquipement !== "tous") {
      queryInterventions += ` AND e.type = ?`;
      paramsInt.push(typeEquipement);
    }
    if (etatEquipement && etatEquipement !== "tous") {
      queryInterventions += ` AND e.etat = ?`;
      paramsInt.push(etatEquipement);
    }
    if (statut && statut !== "tous") {
      queryInterventions += ` AND t.statut = ?`;
      paramsInt.push(statut);
    }
    if (priorite && priorite !== "tous") {
      queryInterventions += ` AND t.priorite = ?`;
      paramsInt.push(priorite);
    }
    if (categorie && categorie !== "tous") {
      queryInterventions += ` AND t.categorie = ?`;
      paramsInt.push(categorie);
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
    if (employeId && employeId !== "tous") {
      queryTickets += ` AND t.demandeur_id = ?`;
      paramsTck.push(employeId);
    }
    if (typeEquipement && typeEquipement !== "tous") {
      queryTickets += ` AND e.type = ?`;
      paramsTck.push(typeEquipement);
    }
    if (etatEquipement && etatEquipement !== "tous") {
      queryTickets += ` AND e.etat = ?`;
      paramsTck.push(etatEquipement);
    }
    if (statut && statut !== "tous") {
      queryTickets += ` AND t.statut = ?`;
      paramsTck.push(statut);
    }
    if (priorite && priorite !== "tous") {
      queryTickets += ` AND t.priorite = ?`;
      paramsTck.push(priorite);
    }
    if (categorie && categorie !== "tous") {
      queryTickets += ` AND t.categorie = ?`;
      paramsTck.push(categorie);
    }

    queryTickets += ` ORDER BY t.numero ASC`;
    const [tickets] = await pool.query<RowDataPacket[]>(queryTickets, paramsTck);

    // 3. Répartition des équipements par état (A)
    let queryEqEtat = `
      SELECT 
        CASE 
          WHEN etat = 'reforme' THEN 'hors_service'
          ELSE etat
        END as etat,
        COUNT(*) as count
      FROM equipements e
      WHERE e.archive = 0
    `;
    const paramsEqEtat: string[] = [];
    if (typeEquipement && typeEquipement !== "tous") {
      queryEqEtat += ` AND e.type = ?`;
      paramsEqEtat.push(typeEquipement);
    }
    queryEqEtat += ` GROUP BY etat`;
    const [eqEtatRows] = await pool.query<RowDataPacket[]>(queryEqEtat, paramsEqEtat);

    const equipementsParEtat: Record<string, number> = {
      en_service: 0,
      en_panne: 0,
      en_maintenance: 0,
      hors_service: 0,
    };
    for (const r of eqEtatRows) {
      const k = String(r.etat);
      if (equipementsParEtat[k] !== undefined) {
        equipementsParEtat[k] += Number(r.count || 0);
      }
    }

    // 4. Répartition des équipements par type (B)
    const [eqTypeRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COALESCE(type, 'Non catégorisé') as type,
        COUNT(*) as count
      FROM equipements
      WHERE archive = 0
      GROUP BY type
      ORDER BY count DESC
    `);
    const equipementsParType = eqTypeRows.map((r) => ({
      type: String(r.type),
      count: Number(r.count),
    }));

    // 5. Évolution temporelle des tickets (C)
    // Regroupement par date de création
    const ticketsEvolutionMap = new Map<string, number>();
    for (const t of tickets) {
      if (t.created_at) {
        const d = new Date(t.created_at).toISOString().split("T")[0];
        ticketsEvolutionMap.set(d, (ticketsEvolutionMap.get(d) || 0) + 1);
      }
    }
    const ticketsEvolution = Array.from(ticketsEvolutionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Répartition des tickets par priorité (D)
    const prioritesCount: Record<string, number> = {
      basse: 0,
      normale: 0,
      haute: 0,
      critique: 0,
    };
    for (const t of tickets) {
      if (t.priorite && prioritesCount[t.priorite] !== undefined) {
        prioritesCount[t.priorite]++;
      }
    }

    // 7. Répartition des tickets par statut (E)
    const statutsCount: Record<string, number> = {
      nouveau: 0,
      en_cours: 0,
      en_attente: 0,
      resolu: 0,
      cloture: 0,
    };
    for (const t of tickets) {
      if (t.statut && statutsCount[t.statut] !== undefined) {
        statutsCount[t.statut]++;
      }
    }

    // 8. Évolution temporelle et analyse par semaine des interventions (F)
    const interventionsEvolutionMap = new Map<string, { count: number; duree: number }>();
    const interventionsSemainesMap = new Map<
      string,
      {
        semaineKey: string;
        semaineLabel: string;
        annee: number;
        semaineNumero: number;
        debutSemaine: string;
        finSemaine: string;
        count: number;
        interventionsAvecDuree: number;
        dureeMinutesTotale: number;
      }
    >();

    let dureeTotaleMinutes = 0;

    // Helper ISO Week pour grouper fidèlement par semaine civile
    function getISOWeekData(dateObj: Date) {
      const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      const isoYear = d.getUTCFullYear();

      // Calcul du lundi (début) et dimanche (fin) de cette semaine ISO
      const simple = new Date(Date.UTC(isoYear, 0, 1 + (weekNo - 1) * 7));
      const dow = simple.getUTCDay();
      const isoWeekStart = new Date(simple);
      if (dow <= 4) {
        isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
      } else {
        isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
      }
      const isoWeekEnd = new Date(isoWeekStart);
      isoWeekEnd.setUTCDate(isoWeekStart.getUTCDate() + 6);

      return {
        isoYear,
        weekNo,
        semaineKey: `${isoYear}-W${String(weekNo).padStart(2, "0")}`,
        semaineLabel: `S${weekNo}`,
        debutSemaine: isoWeekStart.toISOString().split("T")[0],
        finSemaine: isoWeekEnd.toISOString().split("T")[0],
      };
    }

    for (const i of interventions) {
      if (i.debut) {
        const dObj = new Date(i.debut);
        const d = dObj.toISOString().split("T")[0];
        const prev = interventionsEvolutionMap.get(d) || { count: 0, duree: 0 };
        
        // Règle 5 : durée valide uniquement si debut et fin valides et fin >= debut
        const hasValidDuration =
          i.debut !== null &&
          i.fin !== null &&
          i.duree_minutes !== null &&
          Number(i.duree_minutes) >= 0;

        const dur = hasValidDuration ? Number(i.duree_minutes) : 0;

        interventionsEvolutionMap.set(d, {
          count: prev.count + 1,
          duree: prev.duree + dur,
        });

        if (hasValidDuration) {
          dureeTotaleMinutes += dur;
        }

        // Groupement par semaine
        const iso = getISOWeekData(dObj);
        const prevSemaine = interventionsSemainesMap.get(iso.semaineKey) || {
          semaineKey: iso.semaineKey,
          semaineLabel: iso.semaineLabel,
          annee: iso.isoYear,
          semaineNumero: iso.weekNo,
          debutSemaine: iso.debutSemaine,
          finSemaine: iso.finSemaine,
          count: 0,
          interventionsAvecDuree: 0,
          dureeMinutesTotale: 0,
        };

        prevSemaine.count += 1;
        if (hasValidDuration) {
          prevSemaine.interventionsAvecDuree += 1;
          prevSemaine.dureeMinutesTotale += dur;
        }

        interventionsSemainesMap.set(iso.semaineKey, prevSemaine);
      }
    }

    const interventionsEvolution = Array.from(interventionsEvolutionMap.entries())
      .map(([date, val]) => ({ date, count: val.count, duree: val.duree }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Transformation en tableau d'analyse par semaine ordonné chronologiquement
    const interventionsParSemaine = Array.from(interventionsSemainesMap.values())
      .sort((a, b) => a.semaineKey.localeCompare(b.semaineKey))
      .map((s) => {
        const dureeHeuresTotale = Math.round((s.dureeMinutesTotale / 60) * 10) / 10;
        const dureeMoyenneMinutes =
          s.interventionsAvecDuree > 0
            ? Math.round(s.dureeMinutesTotale / s.interventionsAvecDuree)
            : 0;
        const dureeMoyenneHeures = Math.round((dureeMoyenneMinutes / 60) * 10) / 10;

        return {
          semaineKey: s.semaineKey,
          semaineLabel: s.semaineLabel,
          annee: s.annee,
          semaineNumero: s.semaineNumero,
          debutSemaine: s.debutSemaine,
          finSemaine: s.finSemaine,
          count: s.count,
          interventionsAvecDuree: s.interventionsAvecDuree,
          dureeMinutesTotale: s.dureeMinutesTotale,
          dureeHeuresTotale,
          dureeMoyenneMinutes,
          dureeMoyenneHeures,
        };
      });

    const totalIncidents = tickets.length;
    const totalInterventions = interventions.length;
    const tauxResolution =
      totalIncidents > 0
        ? Math.round(
            ((statutsCount.resolu + statutsCount.cloture) / totalIncidents) * 100
          )
        : 100;

    return NextResponse.json({
      success: true,
      data: {
        filtres: {
          date_debut: dateDebut || null,
          date_fin: dateFin || null,
          service_id: serviceId || "tous",
          type_equipement: typeEquipement || "tous",
          statut: statut || "tous",
          priorite: priorite || "tous",
        },
        synthese: {
          totalIncidents,
          totalInterventions,
          statutsCount,
          prioritesCount,
          dureeTotaleMinutes,
          tauxResolution,
        },
        graphiques: {
          equipementsParEtat,
          equipementsParType,
          ticketsEvolution,
          prioritesCount,
          statutsCount,
          interventionsEvolution,
          interventionsParSemaine,
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
