import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "parc_info_touba_gaz",
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 3000,      // réduit de 10s → 3s
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 60000,        // libère les connexions inactives après 60s
  maxIdle: 5,                // garde max 5 connexions au repos
});

export default pool;
