const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "parc_info_touba_gaz",
  });

  console.log("Applying enum migration...");
  await pool.query("ALTER TABLE equipements MODIFY COLUMN etat ENUM('en_service', 'en_panne', 'en_maintenance', 'reforme', 'hors_service') NOT NULL DEFAULT 'en_service'");
  await pool.query("UPDATE equipements SET etat = 'hors_service' WHERE etat = 'reforme'");
  await pool.query("ALTER TABLE equipements MODIFY COLUMN etat ENUM('en_service', 'en_panne', 'en_maintenance', 'hors_service') NOT NULL DEFAULT 'en_service'");
  
  try {
    await pool.query("ALTER TABLE tickets ADD COLUMN priorite_explication VARCHAR(255) NULL AFTER priorite");
  } catch (e) {
    console.log("priorite_explication note:", e.message);
  }

  const [res] = await pool.query("DESCRIBE equipements");
  const etatCol = res.find(r => r.Field === 'etat');
  console.log("Etat column type in MySQL is now:", etatCol.Type);
  process.exit(0);
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
