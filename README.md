# Touba Gaz IT — Gestion du Parc Informatique & Assistance

Application web interne d'entreprise développée pour **Touba Gaz SA**, permettant la centralisation et le suivi complet du parc informatique et des demandes d'assistance des employés.

---

## 🛠️ Stack Technologique

- **Framework Web :** Next.js 16 (App Router)
- **Frontend :** React 19, TypeScript
- **Design System :** Tailwind CSS 4, shadcn/ui, Lucide React, Sonner
- **Base de Données :** MySQL (port 3306, base `parc_info_touba_gaz`)
- **Connecteur SQL :** `mysql2/promise` avec pool de connexions sécurisé
- **Authentification :** Cookie de session httpOnly signé par signature HMAC-SHA256, hachage bcrypt pour les mots de passe
- **Bundler :** Webpack (`--webpack`) adapté à l'environnement Windows

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js installé (v18+)
- MySQL démarré via XAMPP ou MariaDB (port 3306)

### 2. Variables d'environnement (`.env.local`)
Vérifier le fichier `.env.local` à la racine :
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=parc_info_touba_gaz
```

### 3. Initialisation de la Base de Données
Pour initialiser le schéma officiel et injecter le jeu de données de référence :
```powershell
node -e "require('dotenv').config({ path: '.env.local' }); const fs = require('fs'); const mysql = require('mysql2/promise'); (async () => { const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true }); await conn.query(fs.readFileSync('database/schema.sql', 'utf8')); await conn.query(fs.readFileSync('database/seed.sql', 'utf8')); console.log('Base initialisée avec succès !'); await conn.end(); })();"
```

### 4. Lancer l'Application
```bash
npm run dev
```
Accès à l'application : [http://localhost:3000](http://localhost:3000)

### 5. Comptes d'Accès de Démonstration
- **Administrateur IT :** `admin@toubagaz.sn` / `ToubaGaz@2026` (ou `admin123`) → Accès au **Dashboard IT**
- **Collaborateur Employé :** `abisene@toubagaz.sn` / `ToubaGaz@2026` → Accès à **l'Espace Employé**

---

## 📂 Architecture du Projet

```text
parc_info_touba_gaz/
├── database/
│   ├── schema.sql                     # Script DDL officiel des 8 tables relationnelles
│   └── seed.sql                       # Données de référence et comptes Touba Gaz
├── scripts/
│   ├── backup-db.ps1                  # Sauvegarde automatisée non-interactive (rétention 30j)
│   ├── restore-db.ps1                 # Procédure de restauration de sinistre (DRP)
│   └── test-e2e-scenario.js           # Validation E2E automatisée des 14 étapes métier
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # Shell IT (Sidebar navigation + Topbar)
│   │   │   ├── page.tsx               # Supervision générale (KPIs réels MySQL, pannes, par service)
│   │   │   ├── equipements/
│   │   │   │   ├── page.tsx           # Inventaire du parc (recherche, filtres type/état, modal édition rapide)
│   │   │   │   └── [id]/page.tsx      # Fiche technique détaillée & historique complet des affectations
│   │   │   ├── employes/
│   │   │   │   └── page.tsx           # Répertoire du personnel, rattachement service & comptes
│   │   │   ├── services/
│   │   │   │   └── page.tsx           # Directions, départements et comptage équipements/employés
│   │   │   ├── affectations/
│   │   │   │   └── page.tsx           # Gestion des attributions (Employé ou Service) & restitution
│   │   │   ├── tickets/
│   │   │   │   └── page.tsx           # Traitement des incidents, intervention technique & clôture
│   │   │   └── rapports/
│   │   │       └── page.tsx           # Bilans périodiques, durées cumulées & vue imprimable officielle
│   │   ├── espace-employe/
│   │   │   └── page.tsx               # Portail employé : dotations reçues & demandes personnelles
│   │   ├── api/                       # Routes API sécurisées avec contrôle des rôles serveur
│   │   ├── layout.tsx                 # Root Layout Next.js
│   │   ├── page.tsx                   # Page de connexion Touba Gaz IT
│   │   └── globals.css                # Styles thématiques industriels Touba Gaz
│   ├── components/                    # Composants d'interface (UI shadcn, Layout, Header)
│   ├── lib/
│   │   ├── db.ts                      # Pool de connexions MySQL2 optimisé
│   │   ├── auth.ts                    # Vérification des rôles, session HMAC-SHA256 & bcrypt
│   │   └── constants.ts               # Dictionnaires métier, statuts et priorités
│   ├── types/
│   │   └── index.ts                   # Modèles de données TypeScript
│   └── proxy.ts                       # Middleware de routage et contrôle d'accès
├── PROCEDURE_SAUVEGARDE.md            # Guide d'exploitation des sauvegardes & restauration
├── package.json                       # Scripts npm configurés avec bundler Webpack
└── tsconfig.json                      # Configuration TypeScript stricte
```

---

## 🔒 Règles Métier et Conformité Cahier des Charges

1. **Rôles V1 :** 
   - `admin` (Administrateur IT) : supervision, gestion intégrale du parc, affectations, interventions et rapports.
   - `employe` (Collaborateur) : consultation restreinte à ses équipements dotés et suivi de ses propres tickets.
2. **Règle d'Affectation (CT06 / RG08) :**
   - Un équipement est affecté **soit à un employé individuel, soit à un service**, jamais les deux en même temps.
   - Lors d'une réaffectation, l'affectation active précédente est clôturée avec date de fin et l'historique complet est conservé (RG09).
3. **Règle d'Intervention (CT08 / RG07) :**
   - Chaque ticket ne peut être associé qu'à **une seule intervention au maximum**, garantie par contrainte SQL `UNIQUE KEY (ticket_id)`.
   - L'intervention enregistre les dates/heures de début et fin, la durée calculée, les actions techniques et le résultat.
4. **Cycle de Vie du Ticket (RG09 / RG15) :**
   - Statuts : `nouveau` → `en_cours` → `en_attente` → `resolu` → `cloture`.
   - La **résolution technique** est formellement distinguée de la **clôture administrative** finale.
5. **Fiabilité du Tableau de Bord :**
   - Données 100% réelles issues de MySQL.
   - En cas d'erreur de base, affichage d'un panneau explicite (aucun 0 artificiel trompeur).
   - Taux de disponibilité calculé en excluant les équipements réformés et archivés.
6. **Sauvegarde & Sécurité :**
   - Fichiers `.env.local` et dossier `/backups/` protégés et exclus de Git.
   - Script de sauvegarde PowerShell automatisé non-interactif avec rotation de rétention de 30 jours.

---

## 🧪 Validation & Tests

Pour exécuter le scénario complet de test de bout en bout (14 étapes métier) :
```powershell
node scripts\test-e2e-scenario.js
```
Pour tester la sauvegarde et la restauration :
```powershell
.\scripts\backup-db.ps1
Get-ChildItem .\backups\ -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { .\scripts\restore-db.ps1 -BackupFile $_.FullName -Force }
```
Pour compiler l'application :
```bash
npm run build
```
