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

import crypto from "node:crypto";

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

/** Encode URL-safe base64 (évite `+`, `/`, `=` problématiques dans les cookies). */
function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (input.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

/**
 * Signe un cookie bypass et retourne sa valeur à poser dans l'en-tête Set-Cookie.
 * Format : `<payload_b64>.<sig_b64>` où `payload` est un JSON `{code, exp}`.
 */
export function signBypassCookie(code: string): string {
  const secret = getSigningSecret();
  const payload: BypassPayload = {
    code,
    exp: Date.now() + BYPASS_COOKIE_MAX_AGE_SECONDS * 1000,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = b64url(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Vérifie la signature et l'expiration d'un cookie bypass.
 * Retourne le payload si valide, `null` sinon (cookie absent, mal formé,
 * signature invalide, ou expiré).
 */
export function verifyBypassCookie(value: string | undefined | null): BypassPayload | null {
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
  const expected = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const received = b64urlDecode(sigB64);
  if (expected.length !== received.length) return null;
  if (!crypto.timingSafeEqual(expected, received)) return null;

  // Parse + check expiration.
  let payload: BypassPayload;
  try {
    const json = b64urlDecode(payloadB64).toString("utf8");
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
