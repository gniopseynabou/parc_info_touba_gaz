const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  console.log("==> Démarrage de la migration Touba Gaz v2.0...");
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "parc_info_touba_gaz";

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    charset: "utf8mb4",
    multipleStatements: true,
  });

  try {
    console.log("[1/3] Création de la table ticket_attachments si absente...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`ticket_attachments\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`ticket_id\` VARCHAR(36) NOT NULL,
        \`original_name\` VARCHAR(255) NOT NULL,
        \`storage_key\` VARCHAR(255) NOT NULL,
        \`mime_type\` VARCHAR(100) NOT NULL,
        \`size_bytes\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_ticket_id\` (\`ticket_id\`),
        CONSTRAINT \`fk_attachment_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("  -> Table ticket_attachments OK.");

    console.log("[2/3] Ajout de la colonne photo sur equipements si absente...");
    const [cols] = await conn.query("DESCRIBE `equipements`");
    const hasPhoto = cols.some((c) => c.Field === "photo");
    if (!hasPhoto) {
      await conn.query("ALTER TABLE `equipements` ADD COLUMN `photo` VARCHAR(255) NULL AFTER `description`");
      console.log("  -> Colonne photo ajoutée.");
    } else {
      console.log("  -> Colonne photo déjà existante.");
    }

    console.log("[3/3] Restauration des caractères accentués corrompus...");
    const updates = [
      ["services", "nom = 'Direction Générale', description = 'Direction générale et stratégique de Touba Gaz'", "id = 'srv-001'"],
      ["services", "nom = 'Comptabilité & Finances'", "id = 'srv-003'"],
      ["employes", "nom = 'Sène'", "id IN ('emp-005', 'emp-36928fef')"],
      ["utilisateurs", "nom = 'Sène'", "id = 'usr-4310aee7'"],
      ["equipements", "localisation = 'Service Comptabilité'", "id = 'eq-002'"],
      ["equipements", "localisation = 'Direction Générale', description = 'Poste fixe avec double écran'", "id = 'eq-003'"],
      ["equipements", "type = 'Imprimante réseau', description = 'Imprimante noir et blanc réseau partagée'", "id = 'eq-004'"],
      ["equipements", "localisation = 'Direction Générale', description = 'Copieur / Scanner multifonction réseau'", "id = 'eq-005'"],
      ["equipements", "type = 'Switch / Réseau'", "id = 'eq-006'"],
      ["equipements", "description = 'Écran noir suite surtension, diagnostic en cours'", "id = 'eq-008'"],
      ["equipements", "type = 'Écran / Moniteur', description = 'Écran externe HDMI/DP'", "id = 'eq-009'"],
      ["equipements", "localisation = 'Dépôt archives IT', description = 'Carte mère HS, matériel amorti et hors service'", "id = 'eq-010'"],
      ["affectations", "commentaire = 'Matériel de travail administrateur système'", "id = 'aff-001'"],
      ["affectations", "commentaire = 'Imprimante dédiée au service informatique'", "id = 'aff-003'"],
      ["affectations", "commentaire = 'Copieur partagé Direction'", "id = 'aff-004'"],
      ["tickets", "description = 'L\\'imprimante LaserJet affiche un message d\\'erreur bourrage papier récurrent.'", "id = 'tck-001'"],
      ["tickets", "description = 'L\\'ordinateur portable Dell ne démarre plus, voyant orange clignotant après l\\'orage.', categorie = 'Matériel informatique'", "id = 'tck-002'"],
      ["tickets", "description = 'Demande de raccordement d\\'un nouveau câble réseau pour le bureau des stagiaires.', categorie = 'Câblage Ethernet & Prise RJ45'", "id = 'tck-004'"],
      ["interventions", "actions = 'Démontage du carter arrière, nettoyage du rouleau d\\'entraînement et retrait du résidu papier coincé. Tests d\\'impression 10 pages OK.', resultat = 'Résolu avec succès'", "id = 'int-001'"],
    ];

    for (const [table, setClause, whereClause] of updates) {
      await conn.query(`UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`);
    }
    console.log("  -> Accents restaurés avec succès.");

    console.log("\n✅ [SUCCÈS] Migration v2.0 terminée sans aucune perte de données.");
  } catch (err) {
    console.error("❌ Erreur pendant la migration :", err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
