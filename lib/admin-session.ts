import { createHmac, timingSafeEqual } from "node:crypto";

// Adminlösenordets kaka. Ren kod utan databas och cookies, så att proxy.ts, servern
// och enhetstesterna delar den, som lib/site-session.ts. Designen: wiki/system/security.md.

// Med __Host- i produktion av samma skäl som sajtkakan (se lib/site-session.ts)
export const ADMIN_COOKIE = process.env.NODE_ENV === "production" ? "__Host-admin_session" : "admin_session";
export const ADMIN_PATH = "/admin";
// Kakan försvinner när webbläsaren stängs, och godtas bara i 8 timmar
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

// Saknas lösenordet eller nyckeln är admin stängd (null), den öppnas aldrig av misstag
export function adminSecrets(env: Record<string, string | undefined> = process.env) {
  const password = env.ADMIN_PASSWORD;
  const secret = env.ADMIN_SESSION_SECRET;
  return password && secret ? { password, secret } : null;
}

// "admin." först, så att en signatur aldrig kan förväxlas med någon annan HMAC av samma nyckel
const sign = (expires: number, parentId: number, secret: string) =>
  createHmac("sha256", secret).update(`admin.${expires}.${parentId}`).digest("hex");

// Kakans värde: "<utgångstid i sekunder>.<förälderns id, 0 = ingen vald>.<HMAC-SHA256 av båda>".
// Vid byte av förälder behålls utgångstiden, så att inloggningen inte förlängs.
export function createAdminSession(secret: string, parentId: number, expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS) {
  return `${expires}.${parentId}.${sign(expires, parentId, secret)}`;
}

// Utgångstid och vald förälder för en kaka som vi signerat med den här nyckeln och som
// inte gått ut, annars null. Om föräldern finns kontrolleras mot databasen vid varje förfrågan.
export function verifyAdminSession(value: string | undefined, secret: string | undefined, nowMs = Date.now()) {
  if (!value || !secret) return null;
  const match = /^(\d{1,12})\.(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return null;
  const expires = Number(match[1]);
  const parentId = Number(match[2]);
  const expected = Buffer.from(sign(expires, parentId, secret), "hex");
  const actual = Buffer.from(match[3], "hex");
  if (!timingSafeEqual(actual, expected) || expires <= Math.floor(nowMs / 1000)) return null;
  return { expires, parentId };
}
