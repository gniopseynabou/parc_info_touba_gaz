import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "touba_gaz_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "touba-gaz-dev-only-secret-do-not-use-in-production-random-98124";

interface DecodedSession {
  id: string;
  role: "admin" | "employe";
  exp: number;
  [key: string]: unknown;
}

/**
 * Valide cryptographiquement le jeton de session dans le proxy/middleware Next.js 16
 * Utilise l'API standard Web Crypto compatible Edge & Node.js
 */
async function verifySessionInProxy(token: string): Promise<DecodedSession | null> {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    // Conversion base64url vers Uint8Array
    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binaryStr = atob(padded);
    const sigBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      sigBytes[i] = binaryStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!isValid) return null;

    // Décoder le payload
    const payloadStr = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr) as DecodedSession;

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques, assets publics et internes Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionInProxy(sessionCookie) : null;

  // 1. Protection de l'espace administration IT (/dashboard)
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return res;
    }

    if (session.role !== "admin") {
      // Un employé régulier n'a pas accès au dashboard IT
      return NextResponse.redirect(new URL("/espace-employe", request.url));
    }
  }

  // 2. Protection de l'espace collaborateur (/espace-employe)
  if (pathname.startsWith("/espace-employe")) {
    if (!session) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return res;
    }
  }

  // 3. Redirection si l'utilisateur est déjà connecté sur la page d'accueil (/)
  if (pathname === "/") {
    if (session) {
      if (session.role === "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/espace-employe", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, uploads
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
