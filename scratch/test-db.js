import pool from '@/lib/db';
(async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM equipements');
    console.log('equipements count:', rows[0].cnt);
  } catch (e) {
    console.error('Error querying DB:', e);
  }
})();
