import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RoleUtilisateur } from "@/types";

const SESSION_SECRET = process.env.SESSION_SECRET || (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("CRITIQUE SÉCURITÉ: Variable SESSION_SECRET obligatoire non définie en production !"); })()
    : "touba-gaz-dev-only-secret-do-not-use-in-production-random-98124"
);
const SESSION_COOKIE_NAME = "touba_gaz_session";
const SESSION_DURATION_SECONDS = 7 * 24 * 3600; // 7 jours

export interface SessionData {
  id: string;
  email: string;
  nom: string;
  role: RoleUtilisateur;
  employe_id?: string | null;
  service_nom?: string | null;
  exp: number;
}

/**
 * Hache un mot de passe avec bcrypt (10 tours)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Version synchrone pour les migrations ou scripts
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Vérifie si le mot de passe correspond au hash stocké.
 * Supporte bcrypt standard et l'ancien format sel:hash sha256.
 * Tout mot de passe en clair ou bypass est strictement rejeté.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // 1. Format bcrypt standard ($2a$, $2b$, $2y$)
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  // 2. Ancien format sel:hash sha256 (comptes historiques)
  if (storedHash.includes(":")) {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const testHash = crypto.createHmac("sha256", salt).update(password).digest("hex");
    const testBuf = Buffer.from(testHash);
    const origBuf = Buffer.from(originalHash);
    if (testBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(testBuf, origBuf);
  }

  // Rejet strict de tout mot de passe en texte clair
  return false;
}

/**
 * Crée un jeton de session signé cryptographiquement (HMAC-SHA256)
 */
export function createSessionToken(payload: Omit<SessionData, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const data: SessionData = { ...payload, exp };

  const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Valide et décode un jeton de session signé.
 * Rejette strictement tout jeton non signé, altéré ou expiré.
 */
export function verifySessionToken(token: string): SessionData | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionData = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload.id || !payload.role || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expiré
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extrait la session depuis une requête Next.js (headers ou cookies)
 */
export async function getSession(req?: Request): Promise<SessionData | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(SESSION_COOKIE_NAME);
      if (cookie) {
        token = cookie.value;
      }
    } catch {
      // En dehors d'un contexte de rendu avec cookies
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Vérification stricte des autorisations pour les routes API
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: RoleUtilisateur[]
): Promise<{ user: SessionData } | { errorResponse: NextResponse }> {
  const session = await getSession(req);

  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Authentification requise. Session invalide ou expirée." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "Accès refusé. Privilèges insuffisants pour cette opération." },
        { status: 403 }
      ),
    };
  }

  return { user: session };
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
