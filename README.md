# Touba Gaz IT — Gestion du Parc Informatique & Assistance

Application web interne d'entreprise développée pour **Touba Gaz SA**, permettant la centralisation et le suivi complet du parc informatique et des demandes d'assistance des employés.

---

## 🛠️ Stack Technologique

- **Framework Web :** Next.js 16 (App Router)
- **Frontend :** React 19, TypeScript
- **Design System :** Tailwind CSS 4, shadcn/ui, Lucide React, Sonner
- **Base de Données :** MySQL (port 3306, base `parc_info_touba_gaz`)
- **Connecteur SQL :** `mysql2/promise` avec pool de connexions
- **Bundler :** Webpack (`--webpack`)

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js installé (v18+)
- MySQL démarré via XAMPP (port 3306)

### 2. Variables d'environnement (`.env.local`)
Créer ou vérifier le fichier `.env.local` à la racine :
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=parc_info_touba_gaz
```

### 3. Schéma et Données Initiales
Pour initialiser ou réinitialiser la base de données :
```bash
# Dans PowerShell :
node -e "require('dotenv').config({ path: '.env.local' }); const fs = require('fs'); const mysql = require('mysql2/promise'); (async () => { const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true }); await conn.query(fs.readFileSync('database/schema.sql', 'utf8')); await conn.query(fs.readFileSync('database/seed.sql', 'utf8')); console.log('Base initialisée !'); await conn.end(); })();"
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez ensuite : [http://localhost:3000](http://localhost:3000)

---

## 📂 Architecture du Projet

```text
parc_info_touba_gaz/
├── database/
│   ├── schema.sql                     # Script DDL de création des 8 tables
│   └── seed.sql                       # Données de démonstration Touba Gaz
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Shell global (Sidebar + Topbar)
│   │   │   ├── page.tsx               # Tableau de bord principal (KPIs, stats)
│   │   │   ├── equipements/
│   │   │   │   ├── page.tsx           # Inventaire du parc (recherche, filtres, modal ajout)
│   │   │   │   └── [id]/page.tsx      # Fiche technique détaillée & historique
│   │   │   ├── employes/
│   │   │   │   └── page.tsx           # Répertoire du personnel & affectations
│   │   │   ├── services/
│   │   │   │   └── page.tsx           # Directions et départements
│   │   │   ├── affectations/
│   │   │   │   └── page.tsx           # Gestion des attributions (Employé ou Service)
│   │   │   └── tickets/
│   │   │       └── page.tsx           # Suivi des incidents & interventions
│   │   ├── api/
│   │   │   ├── health/route.ts        # Test de santé de la connexion MySQL
│   │   │   ├── dashboard/stats/       # Agrégation des KPIs en direct
│   │   │   ├── equipements/           # CRUD Équipements
│   │   │   ├── employes/              # CRUD Employés
│   │   │   ├── services/              # CRUD Services
│   │   │   ├── affectations/          # CRUD Affectations
│   │   │   └── tickets/               # CRUD Tickets & Interventions
│   │   ├── layout.tsx                 # Root Layout Next.js
│   │   ├── page.tsx                   # Page de connexion Touba Gaz IT
│   │   └── globals.css                # Styles Tailwind & variables thématiques
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx            # Barre latérale navigation & profil
│   │   │   ├── topbar.tsx             # Barre supérieure & statut MySQL
│   │   │   └── shell.tsx              # Wrapper responsive
│   │   └── ui/                        # Composants shadcn/ui
│   ├── lib/
│   │   ├── db.ts                      # Pool de connexions MySQL (mysql2/promise)
│   │   └── constants.ts               # Libellés, statuts, priorités et catégories
│   └── types/
│       └── index.ts                   # Modèles de données TypeScript
├── .env.local                         # Paramètres secrets exclus de Git
├── components.json                    # Configuration shadcn/ui
├── package.json                       # Scripts et dépendances
└── tsconfig.json                      # Configuration TypeScript
```

---

## 🔒 Règles Métier Implémentées

1. **Rôle Applicatif :** Administrateur IT (gestion complète, enregistrement d'incidents par tout canal) et Employé.
2. **Règle d'Affectation :** Un équipement est attribué **soit à un employé, soit à un service**, jamais les deux en même temps.
3. **Règle d'Intervention :** Chaque ticket peut faire l'objet au maximum d'une intervention enregistrée avec contrainte d'unicité SQL.
4. **Statuts des Tickets :** `nouveau`, `en_cours`, `en_attente`, `resolu`, `cloture`.
