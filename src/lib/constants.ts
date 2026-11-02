// ==============================================================================
// Constantes & Libellés métier — Touba Gaz IT
// ==============================================================================

import { EtatEquipement, StatutTicket, PrioriteTicket, CanalTicket } from "@/types";

export const TYPES_EQUIPEMENTS = [
  "Ordinateur portable",
  "Ordinateur fixe",
  "Imprimante réseau",
  "Imprimante multifonction",
  "Écran / Moniteur",
  "Serveur",
  "Switch / Réseau",
  "Routeur / Firewall",
  "Onduleur",
  "Téléphone IP",
  "Scanner",
  "Autre équipement",
];

export const ETATS_EQUIPEMENTS: Record<EtatEquipement, { label: string; badgeClass: string; dotClass: string }> = {
  en_service: {
    label: "En service",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  en_panne: {
    label: "En panne",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
  },
  en_maintenance: {
    label: "En maintenance",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  reforme: {
    label: "Réformé",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export const STATUTS_TICKETS: Record<StatutTicket, { label: string; badgeClass: string }> = {
  nouveau: {
    label: "Nouveau",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  en_cours: {
    label: "En cours",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  en_attente: {
    label: "En attente",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  resolu: {
    label: "Résolu",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cloture: {
    label: "Clôturé",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const PRIORITES_TICKETS: Record<PrioriteTicket, { label: string; badgeClass: string }> = {
  basse: {
    label: "Basse",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
  normale: {
    label: "Normale",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  haute: {
    label: "Haute",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  critique: {
    label: "Critique",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const CANAUX_TICKETS: Record<CanalTicket, string> = {
  application: "Application Web",
  telephone: "Téléphone",
  email: "E-mail",
  presentiel: "Présentiel / Bureau IT",
};

export const CATEGORIES_TICKETS = [
  "Matériel informatique",
  "Imprimante & Scanner",
  "Réseau & Connexion Internet",
  "Câblage Ethernet & Prise RJ45",
  "Alimentation électrique & Onduleur",
  "Logiciel & Système d'exploitation",
  "Messagerie & E-mail",
  "Compte & Accès utilisateur",
  "Autre demande",
];

export const formatCodeEquipement = (code?: number) => {
  if (!code) return "EQ-0000";
  return `EQ-${String(code).padStart(4, "0")}`;
};

export const formatNumeroTicket = (numero?: number) => {
  if (!numero) return "DA-00000";
  return `DA-${String(numero).padStart(5, "0")}`;
};

export const formatDateFr = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};
