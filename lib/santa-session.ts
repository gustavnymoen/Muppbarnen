import { createHmac, timingSafeEqual } from "node:crypto";

// Secret Santa-kakan (MUPP-039): vem som är inloggad som, en medlem i en grupp (MUPP-048). Ren kod utan databas och cookies, som
// lib/site-session.ts, så att servern och enhetstesterna delar den. Designen: wiki/system/secret-santa-entrance.md.

// Med __Host- i produktion av samma skäl som de andra kakorna (se lib/site-session.ts)
export const SANTA_COOKIE = process.env.NODE_ENV === "production" ? "__Host-santa_session" : "santa_session";
// Kakan gäller i ett år, till den årliga rensningen
export const SANTA_SESSION_SECONDS = 365 * 24 * 60 * 60;

// "santa-member." först, så att signaturen aldrig kan förväxlas med en annan HMAC av samma nyckel. Före MUPP-048
// var id:t en persons ("santa."): de gamla kakorna gäller inte längre och kan inte peka ut en annan medlem.
const sign = (memberId: number, secret: string) => createHmac("sha256", secret).update(`santa-member.${memberId}`).digest("hex");

// Kakans värde: "<medlemmens id>.<HMAC-SHA256 av id:t>". Inget annat än id:t.
export const createSantaSession = (secret: string, memberId: number) => `${memberId}.${sign(memberId, secret)}`;

// Medlemmens id för en kaka som vi signerat med den här nyckeln, annars null
export function verifySantaSession(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return null;
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return null;
  const memberId = Number(match[1]);
  const ok = timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(sign(memberId, secret), "hex"));
  return ok ? memberId : null;
}
