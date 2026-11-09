import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "",
  database: process.env.DB_NAME ?? "parc_info_touba_gaz",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 2000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  idleTimeout: 60000,
  maxIdle: 5,
});

export default pool;
