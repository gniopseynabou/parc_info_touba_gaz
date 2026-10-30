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
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  en_panne: {
    label: "En panne",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dotClass: "bg-rose-500",
  },
  en_maintenance: {
    label: "En maintenance",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  reforme: {
    label: "Réformé",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dotClass: "bg-slate-500",
  },
};

export const STATUTS_TICKETS: Record<StatutTicket, { label: string; badgeClass: string }> = {
  nouveau: {
    label: "Nouveau",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  en_cours: {
    label: "En cours",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  en_attente: {
    label: "En attente",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  resolu: {
    label: "Résolu",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  cloture: {
    label: "Clôturé",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
};

export const PRIORITES_TICKETS: Record<PrioriteTicket, { label: string; badgeClass: string }> = {
  basse: {
    label: "Basse",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  normale: {
    label: "Normale",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  haute: {
    label: "Haute",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  critique: {
    label: "Critique",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
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
