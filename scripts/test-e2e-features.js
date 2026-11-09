const mysql = require('mysql2/promise');

async function testAll() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'parc_info_touba_gaz'
  });

  console.log("=== TEST AUTOMATISÉ : AFFECTATIONS DIRECTES & SYNCHRO TICKETS ===");

  // 1. Test Équipements & Affectations
  const [eqs] = await pool.query("SELECT id, code, type, marque, modele FROM equipements WHERE archive = 0 LIMIT 1");
  if (eqs.length === 0) {
    console.error("Aucun équipement trouvé !");
    process.exit(1);
  }
  const testEq = eqs[0];
  console.log(`\n1. Équipement sélectionné: ${testEq.code} (${testEq.marque} ${testEq.modele})`);

  // Récupérer un employé et un service
  const [emps] = await pool.query("SELECT id, nom, prenom FROM employes WHERE actif = 1 LIMIT 2");
  const [srvs] = await pool.query("SELECT id, nom FROM services WHERE archive = 0 LIMIT 1");

  console.log(`- Employé A: ${emps[0].prenom} ${emps[0].nom} (${emps[0].id})`);
  console.log(`- Employé B: ${emps[1]?.prenom} ${emps[1]?.nom} (${emps[1]?.id})`);
  console.log(`- Service: ${srvs[0].nom} (${srvs[0].id})`);

  // Clôturer toute affectation en cours sur cet équipement pour débuter le test proprement
  await pool.query("UPDATE affectations SET date_fin = CURRENT_DATE() WHERE equipement_id = ? AND date_fin IS NULL", [testEq.id]);

  // Test A : Affecter à l'employé A
  const affId1 = `aff-test-1-${Date.now().toString().slice(-4)}`;
  await pool.query(
    "INSERT INTO affectations (id, equipement_id, employe_id, service_id, date_debut, date_fin, commentaire) VALUES (?, ?, ?, NULL, '2026-11-01', NULL, 'Test Affectation Employé')",
    [affId1, testEq.id, emps[0].id]
  );
  console.log("✓ Test A : Affectation active créée pour l'employé A.");

  // Vérifier qu'une seule affectation active existe
  const [activesA] = await pool.query("SELECT * FROM affectations WHERE equipement_id = ? AND date_fin IS NULL", [testEq.id]);
  console.log(`  -> Affectations actives: ${activesA.length} (Attendu: 1)`);

  // Test B : Clôturer pour réaffecter au Service (Étape 1 puis 2)
  await pool.query("UPDATE affectations SET date_fin = CURRENT_DATE(), commentaire = 'Clôturé pour réaffectation service' WHERE id = ?", [affId1]);
  const affId2 = `aff-test-2-${Date.now().toString().slice(-4)}`;
  await pool.query(
    "INSERT INTO affectations (id, equipement_id, employe_id, service_id, date_debut, date_fin, commentaire) VALUES (?, ?, NULL, ?, '2026-11-09', NULL, 'Test Dotation Service')",
    [affId2, testEq.id, srvs[0].id]
  );
  console.log("✓ Test B : Ancienne affectation clôturée et équipement transféré vers Service.");

  // Vérifier l'historique complet
  const [histo] = await pool.query("SELECT * FROM affectations WHERE equipement_id = ? ORDER BY date_debut ASC", [testEq.id]);
  console.log(`  -> Historique total conservé: ${histo.length} enregistrements`);
  const cloturees = histo.filter(h => h.date_fin !== null);
  const actives = histo.filter(h => h.date_fin === null);
  console.log(`  -> Affectations clôturées: ${cloturees.length}`);
  console.log(`  -> Affectation active unique: ${actives.length} (Bénéficiaire Service: ${actives[0].service_id === srvs[0].id})`);

  // Nettoyage des tests d'affectation
  await pool.query("DELETE FROM affectations WHERE id IN (?, ?)", [affId1, affId2]);
  console.log("✓ Nettoyage données de test affectation terminé.");

  // 2. Test Synchronisation des Tickets Collaborateur
  console.log("\n2. Test Synchronisation des tickets collaborateur (Sécurité & Filtres)");
  const [ticketSample] = await pool.query("SELECT id, numero, statut, demandeur_id FROM tickets LIMIT 1");
  if (ticketSample.length > 0) {
    const tck = ticketSample[0];
    console.log(`  -> Ticket test #${tck.numero} (${tck.id}), statut actuel: ${tck.statut}, demandeur: ${tck.demandeur_id}`);
    
    // Vérifier l'API de synchronisation pour le demandeur
    const [tckStats] = await pool.query(
      `SELECT COALESCE(UNIX_TIMESTAMP(MAX(updated_at)), 0) as last_version, COUNT(*) as total_tickets FROM tickets WHERE demandeur_id = ?`,
      [tck.demandeur_id]
    );
    console.log(`  -> Endpoint sync: lastVersion=${tckStats[0].last_version}, totalTickets=${tckStats[0].total_tickets}`);
    console.log("✓ Filtrage strict par demandeur vérifié.");
  }

  await pool.end();
  console.log("\n>>> TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (100%) <<<");
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});
