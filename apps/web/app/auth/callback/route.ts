import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") ?? "/dashboard";

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

    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (err) {
    console.error("[Auth Callback] Exception:", err);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", requestUrl.origin));
  }
}
