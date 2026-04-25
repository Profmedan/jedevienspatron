import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
// SEC-bypass (2026-04-24) — vérification du cookie signé remplace le check
// du query param URL. Cf. tasks/sec-bypass-arbitrages.md.
import { verifyBypassCookie, BYPASS_COOKIE_NAME } from "@/lib/bypass-cookie";

// Routes API POST sensibles protégées contre le CSRF
const CSRF_PROTECTED_ROUTES = [
  "/api/stripe/checkout",
  "/api/sessions",
  "/api/bypass",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Protection CSRF sur les routes POST sensibles ──────────
  // Vérifie que les requêtes POST proviennent du bon domaine
  if (
    request.method === "POST" &&
    CSRF_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // En développement local, on accepte localhost
    const isLocalhost = origin?.startsWith("http://localhost") || origin?.startsWith("http://127.0.0.1");
    const isAllowedOrigin = origin === appUrl || isLocalhost;

    if (origin && !isAllowedOrigin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Routes publiques — pas de vérification auth
  const code = request.nextUrl.searchParams.get("code");

  // SEC-bypass (2026-04-24) — l'autorisation pour `/jeu` en mode bypass repose
  // maintenant sur un cookie HttpOnly signé posé par `/api/bypass` après
  // validation réussie du code. Le query param `?access=bypass` est IGNORÉ
  // par le middleware (il reste accepté côté client pour l'UX de
  // `useGamePersistence`, mais ne confère plus d'autorisation).
  const bypassCookie = request.cookies.get(BYPASS_COOKIE_NAME)?.value;
  // Edge Runtime fix (2026-04-24) : verifyBypassCookie est maintenant async
  // (Web Crypto API). On `await` sa Promise — middleware est déjà async.
  const bypassPayload = await verifyBypassCookie(bypassCookie);
  const hasBypassSession = bypassPayload !== null;
  const hasRoomCode = code !== null;

  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/mentions-legales") ||
    pathname.startsWith("/cgu") ||
    pathname.startsWith("/confidentialite") ||
    pathname.startsWith("/contact") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // /jeu avec room_code ou cookie bypass valide → public (apprenants + testeurs)
  if (pathname.startsWith("/jeu") && (hasBypassSession || hasRoomCode)) {
    return NextResponse.next();
  }

  // SEC-bypass : un utilisateur avec un query param `?access=bypass` MAIS sans
  // cookie valide (cookie absent, expiré ou forgé) doit être redirigé vers /
  // avec un marqueur qui permet à la page d'accueil d'afficher le bon message.
  if (pathname.startsWith("/jeu") && request.nextUrl.searchParams.get("access") === "bypass" && !hasBypassSession) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "?expired=bypass";
    return NextResponse.redirect(homeUrl);
  }

  // Routes protégées (/dashboard, /historique) — vérifier auth
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
