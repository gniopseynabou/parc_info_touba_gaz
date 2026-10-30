// ==============================================================================
// Types TypeScript — Touba Gaz IT
// ==============================================================================

export type RoleUtilisateur = "admin" | "employe";

export type EtatEquipement = "en_service" | "en_panne" | "en_maintenance" | "reforme";

export type StatutTicket = "nouveau" | "en_cours" | "en_attente" | "resolu" | "cloture";

export type PrioriteTicket = "basse" | "normale" | "haute" | "critique";

export type CanalTicket = "application" | "telephone" | "email" | "presentiel";

export interface Service {
  id: string;
  nom: string;
  description?: string | null;
  archive: boolean;
  total_employes?: number;
  total_equipements?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  service_id?: string | null;
  service_nom?: string | null;
  actif: boolean;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Equipement {
  id: string;
  code: number;
  type: string;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  date_achat?: string | null;
  etat: EtatEquipement;
  localisation?: string | null;
  description?: string | null;
  archive: boolean;
  affectation_actuelle?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Affectation {
  id: string;
  equipement_id: string;
  equipement_label?: string;
  equipement_type?: string;
  employe_id?: string | null;
  employe_nom?: string | null;
  service_id?: string | null;
  service_nom?: string | null;
  date_debut: string;
  date_fin?: string | null;
  commentaire?: string | null;
  auteur_id?: string | null;
  created_at?: string;
}

export interface Ticket {
  id: string;
  numero: number;
  demandeur_id: string;
  demandeur_nom?: string;
  service_id?: string | null;
  service_nom?: string | null;
  description: string;
  categorie: string;
  priorite: PrioriteTicket;
  canal: CanalTicket;
  equipement_id?: string | null;
  equipement_label?: string | null;
  statut: StatutTicket;
  date_resolution?: string | null;
  date_cloture?: string | null;
  cree_par?: string | null;
  intervention?: Intervention | null;
  created_at?: string;
  updated_at?: string;
}

export interface Intervention {
  id: string;
  ticket_id: string;
  debut: string;
  fin: string;
  actions: string;
  resultat?: string | null;
  auteur_id: string;
  created_at?: string;
}

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: RoleUtilisateur;
  actif: boolean;
}

export interface DashboardStats {
  totalEquipements: number;
  equipementsEnService: number;
  equipementsEnPanne: number;
  equipementsEnMaintenance: number;
  equipementsReformes: number;
  totalTickets: number;
  ticketsNouveaux: number;
  ticketsEnCours: number;
  ticketsEnAttente: number;
  ticketsResolus: number;
  ticketsClotures: number;
  totalEmployes: number;
  totalServices: number;
  totalAffectationsActives: number;
}
