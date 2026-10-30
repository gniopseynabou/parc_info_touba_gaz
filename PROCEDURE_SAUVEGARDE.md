# 🛡️ Guide & Procédure de Sauvegarde et Restauration — Touba Gaz IT

**Document technique de référence :** `Analyse_des_besoins_v1.2.docx` (Besoins B7, RG12, CT12)  
**Application :** Gestion du Parc Informatique et Suivi des Demandes d'Assistance  
**Système de Gestion de Base de Données (SGBD) :** MySQL 8.x / MariaDB (port 3306)  
**Nom de la base de données :** `parc_info_touba_gaz`  

---

## 1. Objectifs & Politique de Sauvegarde

Pour assurer la continuité des activités de Touba Gaz et la préservation de l'historique des équipements, des affectations et des interventions informatiques, une stratégie de sauvegarde à deux niveaux est mise en place :

1. **Sauvegarde Quotidienne Automatisée :**  
   - Exécution chaque soir à **23h00**.  
   - Type : Sauvegarde logique complète (structure des tables + contraintes + données).  
   - Rétention : Conservation des **30 derniers jours** de sauvegardes avec purge automatique des archives antérieures.  
   - Emplacement local : `parc_info_touba_gaz/backups/` (répertoire exclu de Git par `.gitignore`).  
   - Mode : **100% Non interactif**, lecture sécurisée des identifiants depuis `.env.local` sans mot de passe en clair exposé dans la ligne de commande système (fichier d'options temporaire protégé `--defaults-extra-file`).

2. **Sauvegarde Hebdomadaire Hors-Site (Recommandation IT) :**  
   - Copie du fichier de sauvegarde du vendredi sur un support externe sécurisé ou cloud interne.

---

## 2. Exécution Manuelle d'une Sauvegarde

Pour effectuer une sauvegarde immédiate (avant une mise à jour ou une intervention majeure) :

### Option A — Avec le script PowerShell fourni (Recommandé)

Ouvrez un terminal PowerShell dans le répertoire du projet et lancez :

```powershell
.\scripts\backup-db.ps1
```

Le script :
- Charge automatiquement les paramètres de connexion depuis `.env.local`.
- Détecte automatiquement l'utilitaire `mysqldump` (XAMPP, Laragon, MySQL Server).
- Génère un fichier nommé `backup_parc_info_touba_gaz_AAAAMMJJ_HHMMSS.sql` dans `backups/`.
- Purge automatiquement les fichiers plus vieux que 30 jours (RG12).

### Option B — Ligne de commande directe `mysqldump`

```powershell
mysqldump -u root -p --single-transaction --quick --routines --triggers parc_info_touba_gaz > backups\backup_manuel.sql
```

---

## 3. Automatisation via le Planificateur de Tâches Windows

Pour programmer la sauvegarde tous les jours à 23h00 :

1. Ouvrir le **Planificateur de tâches** (`taskschd.msc`).
2. Cliquer sur **Créer une tâche de base...** dans le panneau d'actions.
3. Nommer la tâche : `Touba Gaz - Sauvegarde Parc Info`.
4. Déclencheur : **Tous les jours**, régler l'heure à **23:00:00**.
5. Action : **Démarrer un programme**.
   - **Programme/script :** `powershell.exe`
   - **Ajouter des arguments :** `-ExecutionPolicy Bypass -File "C:\Users\hp\Desktop\Touba Gaz\parc_info_touba_gaz\scripts\backup-db.ps1"`
   - **Commencer dans :** `C:\Users\hp\Desktop\Touba Gaz\parc_info_touba_gaz`
6. Cliquer sur **Terminer**.

---

## 4. Procédure de Test de Restauration (Disaster Recovery)

> [!IMPORTANT]
> Un test de restauration doit être exécuté au minimum une fois par trimestre sur un environnement de test afin de s'assurer de l'intégrité des données.

### Étape 1 : Vérifier la liste des sauvegardes disponibles

```powershell
Get-ChildItem -Path ".\backups\" -Filter "*.sql" | Sort-Object LastWriteTime -Descending
```

### Étape 2 : Lancer la restauration avec le script

```powershell
.\scripts\restore-db.ps1 -BackupFile ".\backups\backup_parc_info_touba_gaz_20261030_100938.sql"
```

Le script demande confirmation `(O/N)` avant d'injecter les données dans la base MySQL. Pour les automatisations de test, l'option `-Force` permet d'outrepasser la confirmation.

### Étape 3 : Contrôles de validation post-restauration

Une fois la restauration terminée, exécuter les contrôles de cohérence :
1. Se connecter à l'application web Touba Gaz (`admin@toubagaz.sn`).
2. Vérifier le tableau de bord (nombre d'équipements et d'incidents).
3. Contrôler l'historique d'un équipement et vérifier la présence de ses affectations passées.
4. Générer le rapport d'activité pour vérifier l'exactitude des calculs.
