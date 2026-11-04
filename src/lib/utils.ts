export { cn } from "cn";

/**
 * Calcule dynamiquement les initiales d'un utilisateur à partir de son prénom et nom.
 * Exemples :
 * - Seynabou Gniop -> SG
 * - Paul Ismael Flan -> PF
 * - Amadou Ba -> AB
 */
export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "TG";
  const clean = name.trim();
  if (!clean) return "TG";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return `${first}${last}`.toUpperCase() || "TG";
}
