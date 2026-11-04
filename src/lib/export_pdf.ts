import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFRapportData {
  periode: {
    debut: string;
    fin: string;
    filtresTexte: string;
  };
  editionDate: string;
  synthese: {
    totalIncidents: number;
    totalInterventions: number;
    tauxResolution: number;
    dureeTotaleMinutes: number;
  };
  graphiques: {
    equipementsParEtat: Record<string, number>;
    prioritesCount: Record<string, number>;
    statutsCount: Record<string, number>;
  };
  demandesEtInterventions: Array<{
    numero: number;
    date: string;
    demandeur: string;
    service: string;
    equipement: string;
    categorie: string;
    priorite: string;
    statut: string;
    description: string;
    interventionActions?: string | null;
    interventionResultat?: string | null;
    dureeMinutes?: number;
  }>;
}

export function generateProfessionalPDF(data: PDFRapportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Couleurs de la charte Touba Gaz
  const primaryGreen = [22, 163, 74]; // #16A34A
  const darkGreen = [21, 128, 61]; // #15803D
  const darkSlate = [30, 41, 59]; // #1E293B
  const slateText = [71, 85, 105]; // #475569
  const lightBg = [248, 250, 252]; // #F8FAFC
  const borderGray = [226, 232, 240]; // #E2E8F0

  // 1. EN-TÊTE OFFICIEL TOUBA GAZ
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(margin, currentY, 4, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("TOUBA GAZ S.A.", margin + 8, currentY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text("Direction des Systèmes d'Information — Parc Informatique & Assistance", margin + 8, currentY + 11);
  doc.text(`Document officiel édité le ${data.editionDate}`, margin + 8, currentY + 15);

  currentY += 22;

  // Ligne séparatrice
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // 2. BANDEAU TITRE DU RAPPORT ET PÉRIODE
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 18, 3, 3, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, currentY, pageWidth - 2 * margin, 18, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2]);
  doc.text("RAPPORT D'ACTIVITÉ IT & GESTION DES DEMANDES D'ASSISTANCE", margin + 5, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  const periodeStr = `Période d'analyse : du ${data.periode.debut || "Début"} au ${data.periode.fin || "Ce jour"}  |  Filtres appliqués : ${data.periode.filtresTexte || "Tous les départements"}`;
  doc.text(periodeStr, margin + 5, currentY + 13);

  currentY += 24;

  // 3. CARTES KPI (4 CASES DISPOSÉES HORIZONTALEMENT)
  const kpiWidth = (pageWidth - 2 * margin - 9) / 4;
  const kpiHeight = 16;
  const kpis = [
    { label: "Total Signalements", value: String(data.synthese.totalIncidents), color: [14, 165, 233] },
    { label: "Interventions IT", value: String(data.synthese.totalInterventions), color: [16, 185, 129] },
    { label: "Taux de Résolution", value: `${data.synthese.tauxResolution} %`, color: [34, 197, 94] },
    { label: "Temps d'Intervention", value: `${Math.round(data.synthese.dureeTotaleMinutes / 60)} h`, color: [245, 158, 11] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(x, currentY, kpiWidth, kpiHeight, 2, 2, "FD");

    // Indicateur coloré vertical
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, currentY, 2.5, kpiHeight, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(kpi.label, x + 5, currentY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(kpi.value, x + 5, currentY + 12);
  });

  currentY += kpiHeight + 8;

  // 4. RÉPARTITIONS ET GRAPHIQUES SYNTHÉTIQUES
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("1. Répartition opérationnelle & Disponibilité du parc", margin, currentY);

  currentY += 4;

  const statuts = data.graphiques.statutsCount;
  const priorites = data.graphiques.prioritesCount;
  const eqEtat = data.graphiques.equipementsParEtat;

  const recapHead = [["Indicateur", "Détail opérationnel", "Total"]];
  const recapBody = [
    [
      "Disponibilité du parc",
      `En service: ${eqEtat.en_service || 0}   |   En panne: ${eqEtat.en_panne || 0}   |   Maintenance: ${eqEtat.en_maintenance || 0}   |   Hors service: ${eqEtat.hors_service || 0}`,
      String((eqEtat.en_service || 0) + (eqEtat.en_panne || 0) + (eqEtat.en_maintenance || 0) + (eqEtat.hors_service || 0)),
    ],
    [
      "Demandes par Priorité",
      `Critique: ${priorites.critique || 0}   |   Haute: ${priorites.haute || 0}   |   Normale: ${priorites.normale || 0}   |   Basse: ${priorites.basse || 0}`,
      String((priorites.critique || 0) + (priorites.haute || 0) + (priorites.normale || 0) + (priorites.basse || 0)),
    ],
    [
      "Traitement par Statut",
      `Nouveau: ${statuts.nouveau || 0}   |   En cours: ${statuts.en_cours || 0}   |   En attente: ${statuts.en_attente || 0}   |   Résolu/Clôturé: ${(statuts.resolu || 0) + (statuts.cloture || 0)}`,
      String((statuts.nouveau || 0) + (statuts.en_cours || 0) + (statuts.en_attente || 0) + (statuts.resolu || 0) + (statuts.cloture || 0)),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: recapHead,
    body: recapBody,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 118 },
      2: { cellWidth: 24, halign: "center", fontStyle: "bold" },
    },
  });

  const lastTableEnd = (doc as any).lastAutoTable?.finalY || currentY + 30;
  currentY = lastTableEnd + 8;

  // 5. TABLEAU DÉTAILLÉ SYNTHÉTIQUE DES DEMANDES & INTERVENTIONS (Vue unifiée)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`2. Journal des demandes d'assistance & interventions (${data.demandesEtInterventions.length})`, margin, currentY);

  currentY += 4;

  const tableHead = [
    ["Réf / Date", "Demandeur & Service", "Équipement concerné", "Catégorie", "Statut / Priorité", "Description & Intervention technique"],
  ];

  const tableBody = data.demandesEtInterventions.map((row) => {
    let descAndIntervention = row.description || "—";
    if (row.interventionActions) {
      descAndIntervention += `\n[Intervention] ${row.interventionActions}`;
      if (row.interventionResultat) {
        descAndIntervention += ` (Résultat : ${row.interventionResultat})`;
      }
    }

    const statutLabel = row.statut.toUpperCase();
    const prioriteLabel = row.priorite.toUpperCase();

    return [
      `#${row.numero}\n${row.date}`,
      `${row.demandeur}\n(${row.service || "Touba Gaz"})`,
      row.equipement || "Matériel général",
      row.categorie || "Assistance IT",
      `${statutLabel}\n${prioriteLabel}`,
      descAndIntervention,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody.length > 0 ? tableBody : [["—", "—", "—", "—", "—", "Aucune demande trouvée pour cette sélection."]],
    margin: { left: margin, right: margin, bottom: 16 },
    theme: "striped",
    showHead: "everyPage",
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold" },
      1: { cellWidth: 32 },
      2: { cellWidth: 28 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22, fontStyle: "bold" },
      5: { cellWidth: 55 },
    },
    didDrawPage: () => {
      // Pied de page exécuté sur chaque page
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      // Ligne de pied de page
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      // Texte confidentiel à gauche
      doc.text("TOUBA GAZ S.A. — Direction des Systèmes d'Information | Document Confidentiel", margin, pageHeight - 6);

      // Numérotation à droite : Page X sur Y
      const pageStr = `Page ${currentPage} sur ${totalPages}`;
      doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 6);
    },
  });

  // Sauvegarde / Téléchargement du PDF
  const filename = `Rapport_Touba_Gaz_${data.periode.debut || "global"}_${data.periode.fin || "actuel"}.pdf`;
  doc.save(filename);
}
