// ==============================================================================
// Logique de calcul automatique de la priorité des tickets — Touba Gaz IT
// Détermine la priorité et fournit une explication transparente (RG04 / Sécurité)
// ==============================================================================

import { PrioriteTicket } from "@/types";

interface PriorityInput {
  categorie: string;
  description: string;
  equipementType?: string | null;
  isAdmin?: boolean;
  manualPriority?: PrioriteTicket | null;
}

interface PriorityResult {
  priorite: PrioriteTicket;
  explication: string;
}

export function computeTicketPriority(input: PriorityInput): PriorityResult {
  const { categorie, description, equipementType, isAdmin, manualPriority } = input;

  // 1. Si l'administrateur a explicitement choisi une priorité, on conserve son arbitrage
  if (isAdmin && manualPriority && ["basse", "normale", "haute", "critique"].includes(manualPriority)) {
    return {
      priorite: manualPriority,
      explication: "Ajustée manuellement par l'administrateur IT",
    };
  }

  const descClean = (description || "").toLowerCase();
  const catClean = (categorie || "").toLowerCase();
  const eqTypeClean = (equipementType || "").toLowerCase();

  // 2. Détection d'infrastructure ou matériel critique
  const isCriticalEquipment =
    eqTypeClean.includes("serveur") ||
    eqTypeClean.includes("onduleur") ||
    eqTypeClean.includes("switch") ||
    eqTypeClean.includes("routeur") ||
    eqTypeClean.includes("firewall");

  // 3. Détection de mots-clés d'urgence critique
  const criticalKeywords = [
    "bloquant",
    "bloquante",
    "panne totale",
    "panne générale",
    "arret complet",
    "arrêt complet",
    "production arrêtée",
    "production arretee",
    "impossible de travailler",
    "serveur hs",
    "fume",
    "fumée",
    "court-circuit",
    "incendie",
  ];

  for (const kw of criticalKeywords) {
    if (descClean.includes(kw)) {
      return {
        priorite: "critique",
        explication: "Priorité Critique : Impact bloquant critique détecté dans le signalement",
      };
    }
  }

  if (isCriticalEquipment) {
    return {
      priorite: "critique",
      explication: `Priorité Critique : Équipement d'infrastructure centrale (${equipementType})`,
    };
  }

  // 4. Détection de priorité Haute
  const highPriorityKeywords = [
    "urgent",
    "urgence",
    "ne demarre plus",
    "ne démarre plus",
    "ecran noir",
    "écran noir",
    "plante",
    "crash",
    "bloque",
    "bloqué",
    "perte de donnees",
    "perte de données",
    "inaccessible",
    "hors service",
    "virus",
    "piratage",
  ];

  for (const kw of highPriorityKeywords) {
    if (descClean.includes(kw)) {
      return {
        priorite: "haute",
        explication: "Priorité Haute : Incident bloquant identifié pour le poste de travail",
      };
    }
  }

  if (catClean.includes("reseau") || catClean.includes("réseau") || catClean.includes("connexion internet")) {
    return {
      priorite: "haute",
      explication: "Priorité Haute calculée : Incident réseau impactant la communication",
    };
  }

  if (catClean.includes("alimentation") || catClean.includes("onduleur")) {
    return {
      priorite: "haute",
      explication: "Priorité Haute calculée : Défaut d'alimentation électrique",
    };
  }

  // 5. Détection de priorité Basse (demandes d'infos, formulaires, petits réglages)
  const lowPriorityKeywords = [
    "renseignement",
    "information",
    "demande de devis",
    "nouvelle souris",
    "tapis",
    "conseil",
    "question",
    "non urgent",
  ];

  for (const kw of lowPriorityKeywords) {
    if (descClean.includes(kw)) {
      return {
        priorite: "basse",
        explication: "Priorité Basse calculée : Demande d'information ou matériel d'appoint",
      };
    }
  }

  if (catClean.includes("autre") || catClean.includes("compte & accès")) {
    return {
      priorite: "normale",
      explication: "Priorité Normale calculée : Traitement administratif standard",
    };
  }

  // 6. Priorité par défaut
  return {
    priorite: "normale",
    explication: "Priorité Normale calculée : Prise en charge opérationnelle standard",
  };
}
