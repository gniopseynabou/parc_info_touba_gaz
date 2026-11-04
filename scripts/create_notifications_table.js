const mysql = require("mysql2/promise");

async function createNotificationsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "parc_info_touba_gaz",
  });

  console.log("Connecté à MySQL. Création de la table notifications si non existante...");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      ticket_id VARCHAR(36) NULL,
      titre VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'ticket',
      lu TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_lu (user_id, lu),
      INDEX idx_ticket (ticket_id),
      CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Table notifications prête avec succès !");
  await connection.end();
}

createNotificationsTable().catch((err) => {
  console.error("Erreur lors de la création de la table:", err);
  process.exit(1);
});
