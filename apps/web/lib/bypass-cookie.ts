// JEDEVIENSPATRON — Utilitaire de signature / vérification du cookie bypass
//
// Contexte sécurité (2026-04-24) : avant ce module, l'accès à `/jeu?access=bypass`
// reposait uniquement sur un query param dans l'URL, ce qui rendait l'URL
// partageable à l'infini sans re-validation du code bypass. Cf. commit
// d'arbitrage `tasks/sec-bypass-arbitrages.md` et commit `0d27695`.
//
// Ce module remplace ce mécanisme par un cookie HttpOnly signé HMAC-SHA256 :
// - `/api/bypass` (côté serveur) appelle `signBypassCookie()` après validation
//   réussie du code, et pose le cookie via `response.cookies.set(...)`.
// - `middleware.ts` appelle `verifyBypassCookie()` pour autoriser l'accès à
//   `/jeu` uniquement si le cookie est présent, bien signé et non expiré.
// - Le query param `?access=bypass` reste accepté dans l'URL côté client
//   (rôle UX pour `useGamePersistence`) mais ne confère AUCUN accès par
//   lui-même. Seul le cookie signé autorise.
//
// Secret : `BYPASS_SIGNING_SECRET` (env var dédiée à ajouter sur Vercel).
// Fallback TEMPORAIRE de dépannage : `SUPABASE_SERVICE_ROLE_KEY` (toujours
// présente) + warning console, pour éviter de casser la prod si le code est
// déployé avant ajout de l'env var dédiée. À supprimer dès que BYPASS_SIGNING_SECRET
// est configurée sur tous les environnements.
//
// Edge Runtime fix (2026-04-24) : 100 % Web Crypto API (`globalThis.crypto.subtle`)
// au lieu de `node:crypto`. Compatible Node.js 19+, Edge Runtime (middleware
// Next.js), et Browser. `signBypassCookie` et `verifyBypassCookie` sont
// asynchrones (la Web Crypto API est async par construction).

/** Durée de vie du cookie bypass : 4 heures (une session de cours typique). */
const BYPASS_COOKIE_MAX_AGE_SECONDS = 4 * 60 * 60;

/** Nom du cookie (HttpOnly). */
export const BYPASS_COOKIE_NAME = "jdp_bypass_session";

/** Payload minimal signé dans le cookie. */
interface BypassPayload {
  /** Code bypass validé (pour audit / logs si besoin). */
  code: string;
  /** Timestamp d'expiration Unix (millisecondes). */
  exp: number;
}

function getSigningSecret(): string {
  const primary = process.env.BYPASS_SIGNING_SECRET;
  if (primary && primary.length >= 16) return primary;

  // Fallback de dépannage — à supprimer quand BYPASS_SIGNING_SECRET est
  // configurée sur tous les environnements Vercel (Production + Preview).
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (fallback && fallback.length >= 16) {
    // eslint-disable-next-line no-console
    console.warn(
      "[bypass-cookie] BYPASS_SIGNING_SECRET absent — fallback temporaire sur " +
        "SUPABASE_SERVICE_ROLE_KEY. Ajouter l'env var dédiée au plus vite."
    );
    return fallback;
  }

  throw new Error(
    "[bypass-cookie] Aucun secret de signature disponible " +
      "(BYPASS_SIGNING_SECRET ou SUPABASE_SERVICE_ROLE_KEY)."
  );
}

/** Encode URL-safe base64 d'un Uint8Array (compatible Edge Runtime). */
function b64urlEncode(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "==".slice(0, (4 - (input.length % 4)) % 4);
  const bin = atob(padded);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

/** HMAC-SHA256 via Web Crypto API. Asynchrone (subtle.sign retourne une Promise). */
async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

/**
 * Comparaison constant-time de deux Uint8Array. Évite les timing attacks
 * sur la signature (équivalent à `crypto.timingSafeEqual` qui n'existe pas
 * en Web Crypto API).
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Signe un cookie bypass et retourne sa valeur à poser dans l'en-tête Set-Cookie.
 * Format : `<payload_b64>.<sig_b64>` où `payload` est un JSON `{code, exp}`.
 *
 * Async (Web Crypto). Caller doit faire `await signBypassCookie(...)`.
 */
export async function signBypassCookie(code: string): Promise<string> {
  const secret = getSigningSecret();
  const payload: BypassPayload = {
    code,
    exp: Date.now() + BYPASS_COOKIE_MAX_AGE_SECONDS * 1000,
  };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSha256(secret, payloadB64);
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Vérifie la signature et l'expiration d'un cookie bypass.
 * Retourne le payload si valide, `null` sinon (cookie absent, mal formé,
 * signature invalide, ou expiré).
 *
 * Async (Web Crypto). Caller doit faire `await verifyBypassCookie(...)`.
 */
export async function verifyBypassCookie(
  value: string | undefined | null
): Promise<BypassPayload | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let secret: string;
  try {
    secret = getSigningSecret();
  } catch {
    return null;
  }

  // Vérif signature (constant-time pour éviter les timing attacks).
  let expected: Uint8Array;
  try {
    expected = await hmacSha256(secret, payloadB64);
  } catch {
    return null;
  }
  let received: Uint8Array;
  try {
    received = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (!timingSafeEqual(expected, received)) return null;

  // Parse + check expiration.
  let payload: BypassPayload;
  try {
    const json = new TextDecoder().decode(b64urlDecode(payloadB64));
    payload = JSON.parse(json) as BypassPayload;
  } catch {
    return null;
  }
  if (typeof payload.code !== "string" || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;

  return payload;
}

/** Options du cookie HttpOnly (utilisées par `/api/bypass`). */
export const BYPASS_COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: true as const,
  sameSite: "lax" as const,
  path: "/" as const,
  maxAge: BYPASS_COOKIE_MAX_AGE_SECONDS,
};
