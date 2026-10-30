-- ==============================================================================
-- Données de démonstration — Touba Gaz IT
-- ==============================================================================

USE `parc_info_touba_gaz`;

-- Mettre à jour l'employé admin
UPDATE `employes` 
SET `nom` = 'Diop', `prenom` = 'Mamy', `telephone` = '+221 77 123 45 67'
WHERE `id` = 'emp-admin-01';

-- Autres Employés
INSERT INTO `employes` (`id`, `nom`, `prenom`, `email`, `telephone`, `service_id`, `actif`, `user_id`)
VALUES
  ('emp-002', 'Ndiaye', 'Fatou', 'fatou.ndiaye@toubagaz.sn', '+221 77 234 56 78', 'srv-003', 1, NULL),
  ('emp-003', 'Ba', 'Amadou', 'amadou.ba@toubagaz.sn', '+221 78 345 67 89', 'srv-004', 1, NULL),
  ('emp-004', 'Fall', 'Awa', 'awa.fall@toubagaz.sn', '+221 76 456 78 90', 'srv-005', 1, NULL),
  ('emp-005', 'Sène', 'Cheikh', 'cheikh.sene@toubagaz.sn', '+221 77 567 89 01', 'srv-001', 1, NULL),
  ('emp-006', 'Sow', 'Ibrahima', 'ibrahima.sow@toubagaz.sn', '+221 78 678 90 12', 'srv-004', 1, NULL)
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`), `service_id` = VALUES(`service_id`);

-- Équipements
INSERT INTO `equipements` (`id`, `type`, `marque`, `modele`, `numero_serie`, `date_achat`, `etat`, `localisation`, `description`, `archive`)
VALUES
  ('eq-001', 'Ordinateur portable', 'Dell', 'Latitude 5420', 'SN-DELL-88219', '2023-03-15', 'en_service', 'Bureau Informatique', 'Core i7, 16 Go RAM, SSD 512 Go', 0),
  ('eq-002', 'Ordinateur portable', 'HP', 'EliteBook 840 G8', 'SN-HP-99321', '2023-05-20', 'en_service', 'Service Comptabilité', 'Core i5, 16 Go RAM, SSD 256 Go', 0),
  ('eq-003', 'Ordinateur fixe', 'Lenovo', 'ThinkCentre M720', 'SN-LEN-44102', '2022-11-10', 'en_service', 'Direction Générale', 'Poste fixe avec double écran', 0),
  ('eq-004', 'Imprimante réseau', 'HP', 'LaserJet Pro M404dn', 'SN-HP-PRN-019', '2022-08-01', 'en_service', 'Couloir R+1 Informatique', 'Imprimante noir et blanc réseau partagée', 0),
  ('eq-005', 'Imprimante multifonction', 'Canon', 'imageRUNNER 2625i', 'SN-CAN-MFC-551', '2021-09-15', 'en_maintenance', 'Direction Générale', 'Copieur / Scanner multifonction réseau', 0),
  ('eq-006', 'Switch / Réseau', 'Cisco', 'Catalyst 2960-X', 'SN-CIS-SW-1002', '2021-04-12', 'en_service', 'Baie Serveur RDC', 'Switch 24 ports Gigabit PoE', 0),
  ('eq-007', 'Onduleur', 'APC', 'Smart-UPS 1500VA', 'SN-APC-UPS-774', '2022-01-20', 'en_service', 'Salle Serveur', 'Onduleur de protection serveur central', 0),
  ('eq-008', 'Ordinateur portable', 'Dell', 'Vostro 3510', 'SN-DEL-VOST-33', '2023-09-05', 'en_panne', 'Atelier Support IT', 'Écran noir suite surtension, diagnostic en cours', 0),
  ('eq-009', 'Écran / Moniteur', 'Dell', 'P2419H 24 pouces', 'SN-DEL-MON-662', '2023-03-15', 'en_service', 'Ressources Humaines', 'Écran externe HDMI/DP', 0),
  ('eq-010', 'Ordinateur portable', 'HP', 'ProBook 450 G3', 'SN-HP-OLD-001', '2018-06-10', 'reforme', 'Dépôt archives IT', 'Carte mère HS, matériel amorti et réformé', 0)
ON DUPLICATE KEY UPDATE `type` = VALUES(`type`), `etat` = VALUES(`etat`);

-- Affectations (Actives)
INSERT INTO `affectations` (`id`, `equipement_id`, `employe_id`, `service_id`, `date_debut`, `date_fin`, `commentaire`, `auteur_id`)
VALUES
  ('aff-001', 'eq-001', 'emp-admin-01', NULL, '2023-03-20', NULL, 'Matériel de travail administrateur système', 'emp-admin-01'),
  ('aff-002', 'eq-002', 'emp-002', NULL, '2023-05-25', NULL, 'Affectation chef comptable', 'emp-admin-01'),
  ('aff-003', 'eq-004', NULL, 'srv-002', '2022-08-05', NULL, 'Imprimante dédiée au service informatique', 'emp-admin-01'),
  ('aff-004', 'eq-005', NULL, 'srv-001', '2021-09-20', NULL, 'Copieur partagé Direction', 'emp-admin-01')
ON DUPLICATE KEY UPDATE `date_debut` = VALUES(`date_debut`);

-- Tickets
INSERT INTO `tickets` (`id`, `demandeur_id`, `service_id`, `description`, `categorie`, `priorite`, `canal`, `equipement_id`, `statut`, `date_resolution`, `cree_par`)
VALUES
  ('tck-001', 'emp-002', 'srv-003', 'L''imprimante LaserJet affiche un message d''erreur bourrage papier récurrent.', 'Imprimante & Scanner', 'haute', 'application', 'eq-004', 'resolu', '2026-10-25 14:30:00', 'emp-admin-01'),
  ('tck-002', 'emp-003', 'srv-004', 'L''ordinateur portable Dell ne démarre plus, voyant orange clignotant après l''orage.', 'Matériel informatique', 'critique', 'telephone', 'eq-008', 'en_cours', NULL, 'emp-admin-01'),
  ('tck-003', 'emp-004', 'srv-005', 'Impossible de recevoir les e-mails de candidatures depuis ce matin sur Outlook.', 'Messagerie & E-mail', 'normale', 'email', NULL, 'nouveau', NULL, 'emp-admin-01'),
  ('tck-004', 'emp-005', 'srv-001', 'Demande de raccordement d''un nouveau câble réseau pour le bureau des stagiaires.', 'Câblage Ethernet & Prise RJ45', 'basse', 'presentiel', NULL, 'en_attente', NULL, 'emp-admin-01')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `statut` = VALUES(`statut`);

-- Interventions
INSERT INTO `interventions` (`id`, `ticket_id`, `debut`, `fin`, `actions`, `resultat`, `auteur_id`)
VALUES
  ('int-001', 'tck-001', '2026-10-25 11:00:00', '2026-10-25 14:20:00', 'Démontage du carter arrière, nettoyage du rouleau d''entraînement et retrait du résidu papier coincé. Tests d''impression 10 pages OK.', 'Résolu avec succès', 'emp-admin-01')
ON DUPLICATE KEY UPDATE `actions` = VALUES(`actions`);
