import { createHmac, timingSafeEqual } from "node:crypto";

// Secret Santa-kakan (MUPP-039): vem som är inloggad som, en medlem i en grupp (MUPP-048). Ren kod utan databas och cookies, som
// lib/site-session.ts, så att servern och enhetstesterna delar den. Designen: wiki/system/secret-santa-entrance.md.

// Med __Host- i produktion av samma skäl som de andra kakorna (se lib/site-session.ts)
export const SANTA_COOKIE = process.env.NODE_ENV === "production" ? "__Host-santa_session" : "santa_session";
// Kakan gäller i ett år, eller till den årliga rensningen om den kommer först
export const SANTA_SESSION_SECONDS = 365 * 24 * 60 * 60;

// "santa-member." först, så att signaturen aldrig kan förväxlas med en annan HMAC av samma nyckel. Före MUPP-048
// var id:t en persons ("santa."): de gamla kakorna gäller inte längre och kan inte peka ut en annan medlem.
const sign = (memberId: number, year: number, secret: string) => createHmac("sha256", secret).update(`santa-member.${memberId}.${year}`).digest("hex");

// Kakans värde: "<medlemmens id>.<året för den senaste rensningen>.<HMAC-SHA256 av båda>". Efter den årliga rensningen (MUPP-044)
// stämmer året inte längre och kakan gäller inte, så alla loggas ut. Inget annat än id:t och året.
export const createSantaSession = (secret: string, memberId: number, cleanupYear: number) => `${memberId}.${cleanupYear}.${sign(memberId, cleanupYear, secret)}`;

// Kakan är en lista med sådana poster, äldsta först, åtskilda av "_" (MUPP-079). Varje post är signerad för sig, så att en ändrad
// eller påhittad post bara faller bort och aldrig kan peka ut en annan medlem. En gammal kaka med en enda post gäller som en lista med en post.
export const MAX_SANTA_SESSIONS = 10;
const SEPARATOR = "_";

export const joinSantaSessions = (entries: string[]) => entries.slice(-MAX_SANTA_SESSIONS).join(SEPARATOR);

// En posts medlem och rensningsår om vi signerat den med den här nyckeln, annars null
function verifyEntry(value: string, secret: string) {
  const match = /^(\d{1,12})\.(\d{4})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return null;
  const [memberId, year] = [Number(match[1]), Number(match[2])];
  const ok = timingSafeEqual(Buffer.from(match[3], "hex"), Buffer.from(sign(memberId, year, secret), "hex"));
  return ok ? { memberId, cleanupYear: year } : null;
}

// Alla poster i kakan som vi signerat, i kakans ordning (högst så många som får finnas). Att året är det nuvarande och att medlemmen finns kontrollerar anroparen.
export function verifySantaSessions(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return [];
  return value
    .split(SEPARATOR)
    .slice(0, MAX_SANTA_SESSIONS)
    .flatMap((entry) => verifyEntry(entry, secret) ?? []);
}
