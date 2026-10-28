import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Sajtlösenordets kaka och jämförelse. Ren kod utan databas och cookies, så att
// proxy.ts, servern och enhetstesterna delar den. Designen: wiki/system/security.md.

// I produktion med prefixet __Host-: webbläsaren tar då bara emot kakan om den är
// Secure, saknar Domain och gäller hela sajten, så en kaka satt från en underdomän
// godtas inte (TECH-005). Lokalt över http går inte Secure, så där utan prefix.
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-site_session" : "site_session";
export const LOGIN_PATH = "/losenord";
// Kakan gäller i 180 dagar
export const SESSION_SECONDS = 180 * 24 * 60 * 60;

// Lösenordet och nyckeln kommer från miljön. Saknas något stängs sajten
// (null), den öppnas aldrig av misstag.
export function siteSecrets(env: Record<string, string | undefined> = process.env) {
  const password = env.SITE_PASSWORD;
  const secret = env.SITE_SESSION_SECRET;
  return password && secret ? { password, secret } : null;
}

const sign = (expires: number, secret: string) => createHmac("sha256", secret).update(String(expires)).digest("hex");

// Kakans värde: "<utgångstid i sekunder>.<HMAC-SHA256 av tiden>"
export function createSession(secret: string, nowMs = Date.now()) {
  const expires = Math.floor(nowMs / 1000) + SESSION_SECONDS;
  return `${expires}.${sign(expires, secret)}`;
}

// Sant bara för en kaka som vi signerat med den här nyckeln och som inte gått ut
export function verifySession(value: string | undefined, secret: string | undefined, nowMs = Date.now()) {
  if (!value || !secret) return false;
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  const expected = Buffer.from(sign(expires, secret), "hex");
  const actual = Buffer.from(match[2], "hex");
  return timingSafeEqual(actual, expected) && expires > Math.floor(nowMs / 1000);
}

// Jämför SHA-256-hashar av lika längd med timingSafeEqual, så att varken längden
// eller var det skiljer syns i svarstiden
export function passwordMatches(input: string, expected: string) {
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(input), hash(expected));
}

// Dit inloggningen leder: bara adresser på den här sajten. Allt annat
// (en annan sajt, "//evil.se", "/\evil.se") går till startsidan.
export function safeTarget(target: unknown) {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//") || target.includes("\\")) return "/";
  if (/[\u0000-\u001f]/.test(target)) return "/";
  const url = new URL(target, "http://sajten.invalid");
  if (url.origin !== "http://sajten.invalid" || url.pathname === LOGIN_PATH) return "/";
  return url.pathname + url.search;
}
