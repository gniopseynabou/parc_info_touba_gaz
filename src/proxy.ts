import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques et internes Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("touba_gaz_session")?.value;

  // Helper pour décoder le payload de session sans dépendance lourde dans le proxy
  let sessionPayload: { id?: string; role?: string; exp?: number } | null = null;
  if (sessionCookie) {
    try {
      const parts = sessionCookie.split(".");
      if (parts.length === 3) {
        sessionPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      } else {
        sessionPayload = JSON.parse(decodeURIComponent(sessionCookie));
      }
      // Vérifier expiration
      if (sessionPayload?.exp && sessionPayload.exp < Math.floor(Date.now() / 1000)) {
        sessionPayload = null;
      }
    } catch {
      sessionPayload = null;
    }
  }

  // 1. Protection de l'espace administration IT
  if (pathname.startsWith("/dashboard")) {
    if (!sessionPayload) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (sessionPayload.role !== "admin") {
      // Un employé régulier n'a pas accès au dashboard IT
      return NextResponse.redirect(new URL("/espace-employe", request.url));
    }
  }

  // 2. Protection de l'espace collaborateur
  if (pathname.startsWith("/espace-employe")) {
    if (!sessionPayload) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Si l'utilisateur est déjà connecté et va sur la page d'accueil (login)
  if (pathname === "/") {
    if (sessionPayload) {
      if (sessionPayload.role === "admin") {
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
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
