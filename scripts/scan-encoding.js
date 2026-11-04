const mysql = require('mysql2/promise');

async function scan() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'parc_info_touba_gaz',
    charset: 'utf8mb4'
  });

  const [tables] = await conn.query('SHOW TABLES');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [rows] = await conn.query('SELECT * FROM `' + tableName + '`');
    for (const row of rows) {
      for (const [col, val] of Object.entries(row)) {
        if (typeof val === 'string' && (val.includes('??') || val.includes('Ã'))) {
          console.log(`Corrupted in ${tableName}.${col} (id: ${row.id || 'N/A'}): "${val}"`);
        }
      }
    }
  }
  await conn.end();
}

scan().catch(console.error);
