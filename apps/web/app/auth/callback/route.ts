import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getValidRedirectUrl } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawRedirectTo = requestUrl.searchParams.get("redirectTo");
  const cookieRedirectTo = request.cookies.get("post_auth_redirect")?.value;
  let redirectTo = "/dashboard";

  if (rawRedirectTo) {
    try {
      redirectTo = getValidRedirectUrl(decodeURIComponent(rawRedirectTo));
    } catch {
      redirectTo = getValidRedirectUrl(rawRedirectTo);
    }
  } else if (cookieRedirectTo) {
    try {
      redirectTo = getValidRedirectUrl(decodeURIComponent(cookieRedirectTo));
    } catch {
      redirectTo = getValidRedirectUrl(cookieRedirectTo);
    }
  }

  if (!code) {
    const error = requestUrl.searchParams.get("error");
    if (error === "access_denied") {
      return NextResponse.redirect(new URL("/auth/login?error=oauth_cancelled", requestUrl.origin));
    }
    return NextResponse.redirect(new URL("/auth/login?error=invalid_code", requestUrl.origin));
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[Auth Callback]", error.message);
      return NextResponse.redirect(new URL("/auth/login?error=code_expired", requestUrl.origin));
    }

    const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    response.cookies.set("post_auth_redirect", "", { path: "/", maxAge: 0 });
    return response;
  } catch (err) {
    console.error("[Auth Callback] Exception:", err);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", requestUrl.origin));
  }
}
