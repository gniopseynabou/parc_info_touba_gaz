const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

function generateGuidePDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2; // 190 mm

  // Palette de couleurs Touba Gaz (Contraste élevé & Charte officielle)
  const cPrimary = [22, 163, 74];         // #16A34A Vert principal
  const cPrimaryDark = [21, 128, 61];     // #15803D Vert foncé
  const cPrimaryLight = [240, 253, 244];  // #F0FDF4 Vert très pâle
  const cPrimaryBorder = [187, 247, 208]; // #BBF7D0 Bordure verte
  const cDark = [15, 23, 42];             // #0F172A Ardoise foncé (titres & texte principal)
  const cBody = [30, 41, 59];             // #1E293B Corps de texte contrasté
  const cMuted = [100, 116, 139];         // #64748B Texte secondaire / légendes
  const cBgCard = [248, 250, 252];        // #F8FAFC Fond des cartes
  const cBorder = [226, 232, 240];        // #E2E8F0 Bordures nettes
  const cWhite = [255, 255, 255];

  // Statuts réels Touba Gaz
  const statuts = {
    nouveau: { bg: [240, 249, 255], border: [186, 230, 253], text: [3, 105, 161], label: "Nouveau" },
    en_cours: { bg: [254, 243, 199], border: [253, 230, 138], text: [180, 83, 9], label: "En cours" },
    en_attente: { bg: [243, 232, 255], border: [233, 213, 255], text: [126, 34, 206], label: "En attente" },
    resolu: { bg: [236, 253, 245], border: [167, 243, 208], text: [4, 120, 87], label: "Résolu" },
    cloture: { bg: [241, 245, 249], border: [203, 213, 225], text: [51, 65, 85], label: "Clôturé" },
  };

  // Helper pour dessiner un en-tête de section numéroté
  function drawSectionHeader(num, title, y, badgeText = "") {
    // Fond léger bandeau
    doc.setFillColor(cPrimaryLight[0], cPrimaryLight[1], cPrimaryLight[2]);
    doc.setDrawColor(cPrimaryBorder[0], cPrimaryBorder[1], cPrimaryBorder[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(marginX, y, contentWidth, 6.4, 1, 1, "FD");

    // Pastille numéro
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.roundedRect(marginX + 1.2, y + 1, 4.4, 4.4, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(num), marginX + 3.4, y + 4.2, { align: "center" });

    // Titre de section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(title.toUpperCase(), marginX + 7.8, y + 4.5);

    // Badge secondaire
    if (badgeText) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
      doc.text(badgeText, marginX + contentWidth - 3, y + 4.3, { align: "right" });
    }
  }

  // =========================================================================
  // 1. EN-TÊTE OFFICIEL TOUBA GAZ (y: 8 à 32 mm)
  // =========================================================================
  const headerY = 8;
  const headerH = 23.5;

  // Bandeau supérieur vert émeraude
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.roundedRect(marginX, headerY, contentWidth, 2.4, 1, 1, "F");

  // Cadre d'en-tête
  doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, headerY + 1.5, contentWidth, headerH - 1.5, 1.5, 1.5, "S");

  // Logo Touba Gaz
  const logoPath = path.join(process.cwd(), "public", "logo.jpg");
  if (fs.existsSync(logoPath)) {
    try {
      const logoData = fs.readFileSync(logoPath);
      doc.addImage(logoData, "JPEG", marginX + 4, headerY + 4.2, 16.5, 16.5);
    } catch {
      doc.setFillColor(cPrimaryLight[0], cPrimaryLight[1], cPrimaryLight[2]);
      doc.roundedRect(marginX + 4, headerY + 4.2, 16.5, 16.5, 1.5, 1.5, "FD");
    }
  }

  // Titres & sous-titres
  const titleX = marginX + 23.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("TOUBA GAZ", titleX, headerY + 8.5);

  // Badge "IT Asset & Service Desk"
  doc.setFillColor(cPrimaryLight[0], cPrimaryLight[1], cPrimaryLight[2]);
  doc.setDrawColor(cPrimaryBorder[0], cPrimaryBorder[1], cPrimaryBorder[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(titleX + 37, headerY + 4.8, 38, 4.8, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.text("PARC INFORMATIQUE & ASSISTANCE", titleX + 56, headerY + 8.2, { align: "center" });

  // Sous-titre officiel
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.8);
  doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.text("Guide utilisateur — Application de gestion du parc informatique", titleX, headerY + 14);

  // Phrase d'accroche demandée
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(cBody[0], cBody[1], cBody[2]);
  doc.text(
    "Ce guide présente les principales étapes pour utiliser l'application de gestion du parc informatique et de suivi des demandes d'assistance.",
    titleX,
    headerY + 19
  );

  // Badge Document de livraison à droite
  doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX + contentWidth - 36, headerY + 4.5, 33, 16.5, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("Document de Livraison", marginX + contentWidth - 19.5, headerY + 8.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text("Version officielle 1.0", marginX + contentWidth - 19.5, headerY + 12.8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.text("Employés & IT Touba Gaz", marginX + contentWidth - 19.5, headerY + 17, { align: "center" });

  // =========================================================================
  // 2. SECTION 1 : CONNEXION & DÉCONNEXION (y: 35 à 60 mm)
  // =========================================================================
  const sec1Y = 34.8;
  drawSectionHeader(1, "Connexion & Déconnexion", sec1Y, "Accès sécurisé par profil");

  const stepCardY = sec1Y + 7.6;
  const stepCardH = 17.5;
  const colW = (contentWidth - 6) / 4; // 4 colonnes régulières (46 mm chacune)

  const stepsConnexion = [
    {
      num: 1,
      title: "Accéder à l'application",
      lines: [
        "Ouvrez le navigateur web et",
        "accédez à l'adresse interne",
        "dédiée à Touba Gaz IT.",
      ],
    },
    {
      num: 2,
      title: "Saisir ses identifiants",
      lines: [
        "Renseignez votre adresse e-mail",
        "professionnelle (@toubagaz.sn)",
        "et votre mot de passe.",
      ],
    },
    {
      num: 3,
      title: "Se connecter",
      lines: [
        "Cliquez sur « Se connecter ».",
        "Redirection automatique vers votre",
        "espace selon votre profil.",
      ],
    },
    {
      num: 4,
      title: "Se déconnecter",
      lines: [
        "Cliquez sur le profil en haut à",
        "droite, puis « Déconnexion »",
        "pour sécuriser votre session.",
      ],
    },
  ];

  stepsConnexion.forEach((st, idx) => {
    const x = marginX + idx * (colW + 2);
    doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, stepCardY, colW, stepCardH, 1.2, 1.2, "FD");

    // Pastille numéro
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.circle(x + 3.8, stepCardY + 4, 2.3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(st.num), x + 3.8, stepCardY + 4.8, { align: "center" });

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(st.title, x + 7.8, stepCardY + 4.8);

    // Lignes
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(cBody[0], cBody[1], cBody[2]);
    let tY = stepCardY + 9;
    st.lines.forEach((l) => {
      doc.text(l, x + 2.8, tY);
      tY += 3.4;
    });
  });

  // =========================================================================
  // 3. SECTION 2 : POUR L'EMPLOYÉ (y: 63.5 à 125.5 mm)
  // =========================================================================
  const sec2Y = 63.5;
  drawSectionHeader(2, "Pour l'Employé — Créer une demande & Suivre ses équipements", sec2Y, "Espace Employé");

  const empW = (contentWidth - 3) / 2; // 93.5 mm par colonne
  const empCardY = sec2Y + 7.6;
  const empCardH = 54;

  // --- SOUS-CARTE GAUCHE : CRÉER UNE DEMANDE D'ASSISTANCE ---
  doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, empCardY, empW, empCardH, 1.5, 1.5, "FD");

  // En-tête sous-carte
  doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
  doc.roundedRect(marginX + 0.5, empCardY + 0.5, empW - 1, 6.5, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("CRÉER UNE DEMANDE D'ASSISTANCE (4 ÉTAPES)", marginX + 3.5, empCardY + 4.8);

  const empSteps = [
    {
      num: "1",
      title: "Ouvrir l'Espace Employé",
      desc: "Connectez-vous à votre espace personnel pour accéder à votre tableau de bord collaborateur.",
    },
    {
      num: "2",
      title: "Cliquer sur « + Nouvelle demande »",
      desc: "Utilisez le bouton vert d'action ou cliquez sur « Signaler un problème » directement sur l'équipement.",
    },
    {
      num: "3",
      title: "Décrire le problème rencontré",
      desc: "Sélectionnez l'équipement concerné (optionnel), la catégorie (Matériel, Réseau, Logiciel, Imprimante) et décrivez la panne.",
    },
    {
      num: "4",
      title: "Valider l'envoi",
      desc: "Cliquez sur « Créer la demande ». Le ticket est généré avec son numéro unique (ex: DA-00015) et notifié à l'IT.",
    },
  ];

  let stepY = empCardY + 10.5;
  empSteps.forEach((st) => {
    // Pastille numéro
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.circle(marginX + 4.5, stepY + 1.8, 2.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(255, 255, 255);
    doc.text(st.num, marginX + 4.5, stepY + 2.7, { align: "center" });

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(st.title, marginX + 9, stepY + 2.6);

    // Description multiligne
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(cBody[0], cBody[1], cBody[2]);
    const splitDesc = doc.splitTextToSize(st.desc, empW - 12);
    doc.text(splitDesc, marginX + 9, stepY + 6.5);

    stepY += 10.6;
  });

  // --- SOUS-CARTE DROITE : SUIVRE UNE DEMANDE & LES ÉQUIPEMENTS ---
  const empRightX = marginX + empW + 3;
  doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(empRightX, empCardY, empW, empCardH, 1.5, 1.5, "FD");

  // En-tête sous-carte
  doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
  doc.roundedRect(empRightX + 0.5, empCardY + 0.5, empW - 1, 6.5, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("SUIVRE SES DEMANDES & SES ÉQUIPEMENTS", empRightX + 3.5, empCardY + 4.8);

  const empFollowItems = [
    {
      title: "Consulter ses tickets",
      desc: "Accédez à l'onglet « Mes Demandes » pour retrouver tous vos tickets ouverts ou passés, avec date et référence officielle.",
    },
    {
      title: "Vérifier leur statut en direct",
      desc: "Le statut évolue en temps réel sans nécessiter de recharger la page grâce à la synchronisation automatique de l'application.",
    },
    {
      title: "Consulter les informations de traitement",
      desc: "Dès que l'IT intervient, visualisez les actions techniques entreprises, les commentaires et le résultat final de la résolution.",
    },
    {
      title: "Consulter ses équipements attribués",
      desc: "L'onglet « Mes Équipements » présente votre matériel individuel affecté ainsi que les équipements partagés de votre service.",
    },
  ];

  let followY = empCardY + 10.5;
  empFollowItems.forEach((item) => {
    // Puce verte
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.circle(empRightX + 4.5, followY + 2, 1.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(item.title, empRightX + 8.5, followY + 2.6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(cBody[0], cBody[1], cBody[2]);
    const splitDesc = doc.splitTextToSize(item.desc, empW - 12);
    doc.text(splitDesc, empRightX + 8.5, followY + 6.5);

    followY += 10.6;
  });

  // =========================================================================
  // 4. SECTION 3 : STATUTS & CYCLE DE TRAITEMENT D'UN TICKET (y: 128.5 à 180.5 mm)
  // =========================================================================
  const sec3Y = 128.5;
  drawSectionHeader(3, "Cycle de traitement & Statuts réels d'un ticket", sec3Y, "Traçabilité intégrale Touba Gaz");

  const statCardY = sec3Y + 7.6;
  const statCardH = 43.5;

  doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, statCardY, contentWidth, statCardH, 1.5, 1.5, "FD");

  // 5 Badges de statuts réels
  const statusList = [
    {
      title: "1. Nouveau",
      desc: "Demande créée par l'employé, transmise et en attente de prise en charge par l'IT.",
      style: statuts.nouveau,
    },
    {
      title: "2. En cours",
      desc: "Prise en compte par l'administrateur IT. Diagnostic et travaux techniques engagés.",
      style: statuts.en_cours,
    },
    {
      title: "3. En attente",
      desc: "Traitement suspendu temporairement (attente pièce de rechange, retour usager ou prestataire).",
      style: statuts.en_attente,
    },
    {
      title: "4. Résolu",
      desc: "Intervention technique terminée. Actions menées et résultat de dépannage consignés.",
      style: statuts.resolu,
    },
    {
      title: "5. Clôturé",
      desc: "Confirmation finale du bon fonctionnement et archivage administratif officiel du dossier.",
      style: statuts.cloture,
    },
  ];

  const statW = (contentWidth - 4 * 2.5 - 4) / 5; // ~35.2 mm
  let curStatX = marginX + 2;

  statusList.forEach((st) => {
    doc.setFillColor(st.style.bg[0], st.style.bg[1], st.style.bg[2]);
    doc.setDrawColor(st.style.border[0], st.style.border[1], st.style.border[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(curStatX, statCardY + 2.8, statW, 22.5, 1.2, 1.2, "FD");

    // Libellé statut
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(st.style.text[0], st.style.text[1], st.style.text[2]);
    doc.text(st.title, curStatX + statW / 2, statCardY + 7.5, { align: "center" });

    // Description statut
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.3);
    doc.setTextColor(cBody[0], cBody[1], cBody[2]);
    const splitText = doc.splitTextToSize(st.desc, statW - 3);
    doc.text(splitText, curStatX + 1.8, statCardY + 11.8);

    curStatX += statW + 2.5;
  });

  // --- Schéma visuel horizontal du cycle de traitement ---
  const flowY = statCardY + 27.5;
  doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX + 2, flowY, contentWidth - 4, 13.5, 1.2, 1.2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("SCHÉMA DU CYCLE DE TRAITEMENT D'UN TICKET :", marginX + 4.5, flowY + 4.2);

  // Étapes du cycle
  const flowNodes = [
    { label: "Demande", sub: "Collaborateur" },
    { label: "Ticket", sub: "Enregistrement" },
    { label: "Analyse", sub: "Diagnostic IT" },
    { label: "Intervention", sub: "Actions techniques" },
    { label: "Résolution", sub: "Succès validé" },
    { label: "Clôture", sub: "Archivage final" },
  ];

  const nodeW = 23;
  const nodeGap = 7.5;
  const totalFlowW = flowNodes.length * nodeW + (flowNodes.length - 1) * nodeGap;
  let nodeX = marginX + (contentWidth - totalFlowW) / 2;

  flowNodes.forEach((node, idx) => {
    // Boîte étape
    doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
    doc.setDrawColor(cPrimaryBorder[0], cPrimaryBorder[1], cPrimaryBorder[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(nodeX, flowY + 5.5, nodeW, 6.5, 0.8, 0.8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(node.label, nodeX + nodeW / 2, flowY + 8.6, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.4);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text(node.sub, nodeX + nodeW / 2, flowY + 11, { align: "center" });

    // Flèche connecteur
    if (idx < flowNodes.length - 1) {
      const arrowX = nodeX + nodeW + 1.2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
      doc.text("->", arrowX + 1.2, flowY + 9.8);
    }

    nodeX += nodeW + nodeGap;
  });

  // =========================================================================
  // 5. SECTION 4 : POUR L'ADMINISTRATEUR IT (y: 183.5 à 239 mm)
  // =========================================================================
  const sec4Y = 183.5;
  drawSectionHeader(4, "Pour l'Administrateur IT — Gestion du Parc & Pilotage", sec4Y, "Supervision & Droits de gestion");

  const adminCardY = sec4Y + 7.6;
  const gridW = (contentWidth - 4) / 3; // ~62 mm
  const gridH = 22.5;

  const adminModules = [
    {
      title: "Gérer les équipements",
      badge: "Inventaire complet",
      desc: "Créer, modifier et inventorier les matériels (PC, imprimantes, réseau, serveurs). Suivi des caractéristiques techniques, codes (ex: EQ-0001) et états de fonctionnement.",
    },
    {
      title: "Gérer les affectations",
      badge: "Règle d'exclusivité",
      desc: "Attribuer un équipement soit à un employé individuel, soit à un service complet (jamais les deux). Enregistrer les restitutions avec conservation de l'historique.",
    },
    {
      title: "Traiter les tickets",
      badge: "Prise en charge IT",
      desc: "Consulter la file des demandes, filtrer par statut et priorité (Critique, Haute, Normale, Basse), puis assurer la prise en charge et le suivi direct avec l'employé.",
    },
    {
      title: "Enregistrer les interventions",
      badge: "Traçabilité technique",
      desc: "Pour chaque ticket, consigner l'intervention unique : dates/heures de début et fin, calcul de durée, actions techniques menées et résultat de dépannage.",
    },
    {
      title: "Tableau de bord & KPIs",
      badge: "Données 100% réelles",
      desc: "Superviser en temps réel l'état du parc : total équipements, taux de disponibilité calculé, pannes en cours, répartition par service et cloche de notifications.",
    },
    {
      title: "Consulter les rapports",
      badge: "Bilans & Export officiel",
      desc: "Analyser les bilans périodiques filtrables par date et direction, comptabiliser les durées cumulées d'intervention et générer les rapports PDF pour la Direction.",
    },
  ];

  adminModules.forEach((mod, idx) => {
    const colIndex = idx % 3;
    const rowIndex = Math.floor(idx / 3);
    const mX = marginX + colIndex * (gridW + 2);
    const mY = adminCardY + rowIndex * (gridH + 2.8);

    doc.setFillColor(cWhite[0], cWhite[1], cWhite[2]);
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(mX, mY, gridW, gridH, 1.2, 1.2, "FD");

    // Bandeau haut carte
    doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
    doc.roundedRect(mX + 0.5, mY + 0.5, gridW - 1, 5.5, 0.8, 0.8, "F");

    // Titre module
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(mod.title, mX + 2.5, mY + 4);

    // Pastille verte
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.circle(mX + gridW - 3.5, mY + 3.2, 1.2, "F");

    // Description module
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.3);
    doc.setTextColor(cBody[0], cBody[1], cBody[2]);
    const splitText = doc.splitTextToSize(mod.desc, gridW - 5);
    doc.text(splitText, mX + 2.5, mY + 9);
  });

  // =========================================================================
  // 6. SECTION 5 : CONSEILS D'UTILISATION & RECOMMANDATIONS (y: 242 à 281 mm)
  // =========================================================================
  const sec5Y = 242;
  drawSectionHeader(5, "Conseils d'utilisation & Bonnes pratiques", sec5Y, "Sécurité & Efficacité");

  const adviceCardY = sec5Y + 7.6;
  const adviceCardH = 30.5;

  doc.setFillColor(cPrimaryLight[0], cPrimaryLight[1], cPrimaryLight[2]);
  doc.setDrawColor(cPrimaryBorder[0], cPrimaryBorder[1], cPrimaryBorder[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, adviceCardY, contentWidth, adviceCardH, 1.5, 1.5, "FD");

  const advices = [
    {
      title: "Décrire clairement le problème rencontré",
      text: "Indiquez les messages d'erreur exacts et le contexte de survenue pour permettre un diagnostic rapide.",
    },
    {
      title: "Fournir les informations utiles à l'intervention",
      text: "Rattachez systématiquement l'équipement concerné afin d'alimenter son historique de maintenance.",
    },
    {
      title: "Vérifier le statut de sa demande avant toute relance",
      text: "Consultez l'onglet « Mes Demandes » mis à jour en direct dès la prise en charge par le support IT.",
    },
    {
      title: "Se déconnecter après chaque utilisation",
      text: "Fermez impérativement votre session via le menu en haut à droite, en particulier sur les postes partagés.",
    },
    {
      title: "Ne jamais communiquer ses identifiants",
      text: "Vos identifiants de connexion sont strictement personnels et confidentiels. Aucun technicien ne vous les demandera.",
    },
  ];

  let advY = adviceCardY + 5.2;
  advices.forEach((adv) => {
    // Puce carrée verte
    doc.setFillColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
    doc.rect(marginX + 4, advY - 1.8, 1.8, 1.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.1);
    doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
    doc.text(adv.title + " :", marginX + 8, advY - 0.3);

    const titleW = doc.getTextWidth(adv.title + " : ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(adv.text, marginX + 8 + titleW, advY - 0.3);

    advY += 5.2;
  });

  // =========================================================================
  // 7. PIED DE PAGE OFFICIEL (y: 284 à 291 mm)
  // =========================================================================
  const footerY = 285.5;

  // Ligne fine séparatrice
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.25);
  doc.line(marginX, footerY, marginX + contentWidth, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text("TOUBA GAZ SA", marginX, footerY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text("— Direction des Systèmes d'Information — Guide d'utilisation interne de l'application", marginX + 19, footerY + 4.2);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.4);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text("Document confidentiel interne — Support IT", marginX + contentWidth / 2 + 10, footerY + 4.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(cPrimaryDark[0], cPrimaryDark[1], cPrimaryDark[2]);
  doc.text("Page 1 / 1", marginX + contentWidth, footerY + 4.2, { align: "right" });

  // Sauvegarde finale
  const outPath = path.join(process.cwd(), "Guide_utilisateur_Touba_Gaz.pdf");
  doc.save(outPath);
  console.log("Guide utilisateur généré avec succès à :", outPath);
}

generateGuidePDF();
