-- ==============================================================================
-- Schema SQL pour Touba Gaz IT (Base de données MySQL)
-- Application de gestion du parc informatique et suivi des demandes d'assistance
-- Nom de la base : parc_info_touba_gaz
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `parc_info_touba_gaz`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `parc_info_touba_gaz`;

-- -----------------------------------------------------------------------------
-- 1. Table des utilisateurs (Authentification & Rôles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'employe') NOT NULL DEFAULT 'employe',
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_utilisateurs_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table des services de l'entreprise
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(36) NOT NULL,
  `nom` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `archive` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_services_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table des employés
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employes` (
  `id` VARCHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NULL,
  `telephone` VARCHAR(30) NULL,
  `service_id` VARCHAR(36) NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `user_id` VARCHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_employes_email` (`email`),
  UNIQUE KEY `idx_employes_user_id` (`user_id`),
  KEY `fk_employes_service` (`service_id`),
  CONSTRAINT `fk_employes_service` FOREIGN KEY (`service_id`)
    REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_employes_utilisateur` FOREIGN KEY (`user_id`)
    REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table des équipements (Parc informatique)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `equipements` (
  `id` VARCHAR(36) NOT NULL,
  `code` INT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(80) NOT NULL,
  `marque` VARCHAR(100) NULL,
  `modele` VARCHAR(100) NULL,
  `numero_serie` VARCHAR(100) NULL,
  `date_achat` DATE NULL,
  `etat` ENUM('en_service', 'en_panne', 'en_maintenance', 'reforme') NOT NULL DEFAULT 'en_service',
  `localisation` VARCHAR(150) NULL,
  `description` TEXT NULL,
  `archive` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_equipements_code` (`code`),
  UNIQUE KEY `idx_equipements_num_serie` (`numero_serie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table des affectations de matériel
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `affectations` (
  `id` VARCHAR(36) NOT NULL,
  `equipement_id` VARCHAR(36) NOT NULL,
  `employe_id` VARCHAR(36) NULL,
  `service_id` VARCHAR(36) NULL,
  `date_debut` DATE NOT NULL,
  `date_fin` DATE NULL,
  `commentaire` TEXT NULL,
  `auteur_id` VARCHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_affectations_equipement` (`equipement_id`),
  KEY `fk_affectations_employe` (`employe_id`),
  KEY `fk_affectations_service` (`service_id`),
  CONSTRAINT `fk_affectations_equipement` FOREIGN KEY (`equipement_id`)
    REFERENCES `equipements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_affectations_employe` FOREIGN KEY (`employe_id`)
    REFERENCES `employes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_affectations_service` FOREIGN KEY (`service_id`)
    REFERENCES `services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table des demandes d'assistance (Tickets)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(36) NOT NULL,
  `numero` INT NOT NULL AUTO_INCREMENT,
  `demandeur_id` VARCHAR(36) NOT NULL,
  `service_id` VARCHAR(36) NULL,
  `description` TEXT NOT NULL,
  `categorie` VARCHAR(100) NOT NULL,
  `priorite` ENUM('basse', 'normale', 'haute', 'critique') NOT NULL DEFAULT 'normale',
  `canal` ENUM('application', 'telephone', 'email', 'presentiel') NOT NULL DEFAULT 'application',
  `equipement_id` VARCHAR(36) NULL,
  `statut` ENUM('nouveau', 'en_cours', 'en_attente', 'resolu', 'cloture') NOT NULL DEFAULT 'nouveau',
  `date_resolution` DATETIME NULL,
  `date_cloture` DATETIME NULL,
  `cree_par` VARCHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tickets_numero` (`numero`),
  KEY `fk_tickets_demandeur` (`demandeur_id`),
  KEY `fk_tickets_service` (`service_id`),
  KEY `fk_tickets_equipement` (`equipement_id`),
  CONSTRAINT `fk_tickets_demandeur` FOREIGN KEY (`demandeur_id`)
    REFERENCES `employes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_service` FOREIGN KEY (`service_id`)
    REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_equipement` FOREIGN KEY (`equipement_id`)
    REFERENCES `equipements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table des interventions de maintenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interventions` (
  `id` VARCHAR(36) NOT NULL,
  `ticket_id` VARCHAR(36) NOT NULL,
  `debut` DATETIME NOT NULL,
  `fin` DATETIME NOT NULL,
  `actions` TEXT NOT NULL,
  `resultat` TEXT NULL,
  `auteur_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_interventions_ticket` (`ticket_id`),
  CONSTRAINT `fk_interventions_ticket` FOREIGN KEY (`ticket_id`)
    REFERENCES `tickets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table d'audit des actions système
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `journal_audit` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `table_nom` VARCHAR(100) NOT NULL,
  `enregistrement_id` VARCHAR(64) NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` JSON NULL,
  `auteur_id` VARCHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_table` (`table_nom`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Données initiales (Services et compte administrateur initial)
-- -----------------------------------------------------------------------------
INSERT INTO `services` (`id`, `nom`, `description`, `archive`)
VALUES
  ('srv-001', 'Direction Générale', 'Direction générale et stratégique de Touba Gaz', 0),
  ('srv-002', 'Service Informatique', 'Support technique, maintenance et infrastructure IT', 0),
  ('srv-003', 'Comptabilité & Finances', 'Gestion comptable, facturation et finances', 0),
  ('srv-004', 'Logistique & Exploitation Gaz', 'Centre emplisseur, distribution et logistique gaz', 0),
  ('srv-005', 'Ressources Humaines', 'Gestion du personnel et paie', 0)
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`);

INSERT INTO `utilisateurs` (`id`, `email`, `password_hash`, `nom`, `prenom`, `role`, `actif`)
VALUES
  ('usr-admin-01', 'admin@toubagaz.sn', '$2b$10$eO1Wf5R2pQc.K9xWb1cQ3.0aZbM1q9I/jY3v9TjR.G1lQvP2e1.mO', 'Admin', 'Touba Gaz IT', 'admin', 1)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `employes` (`id`, `nom`, `prenom`, `email`, `telephone`, `service_id`, `actif`, `user_id`)
VALUES
  ('emp-admin-01', 'Admin', 'Système', 'admin@toubagaz.sn', '+221 33 000 00 00', 'srv-002', 1, 'usr-admin-01')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
