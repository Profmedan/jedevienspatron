import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  const access = request.nextUrl.searchParams.get("access");
  const isBypassOrRoomCode = (code !== null) || (access === "bypass");

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

  // /jeu avec room_code ou bypass code → public (apprenants + testeurs)
  if (pathname.startsWith("/jeu") && isBypassOrRoomCode) {
    return NextResponse.next();
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
