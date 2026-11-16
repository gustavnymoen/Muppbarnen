import "server-only";
import { cookies } from "next/headers";
import { all, get } from "./db";
import { beginAttempt, clearAttempt, registerWrong, wrongWait } from "./login-block";
import { parseId } from "./form-input";
import type { EventStatus } from "./santa";
import { cleanupYear } from "./santa-cleanup";
import { setSessionCookie } from "./session-cookie";
import { createSantaSession, joinSantaSessions, SANTA_COOKIE, SANTA_SESSION_SECONDS, verifySantaSessions } from "./santa-session";
import { siteSecrets } from "./site-session";

// Ingången till Secret Santa (MUPP-039): vad besökaren får se innan hen loggat in (bara namn),
// kontrollen av telefon eller e-post, och vem som är inloggad. Telefon och e-post läses bara här,
// för kontrollen, och lämnar aldrig funktionen. Designen: wiki/system/secret-santa-entrance.md.

type EntranceMember = { memberId: number; name: string };
export type SantaMember = { id: number; name: string; eventId: number; eventName: string; amount: number | null; status: EventStatus };
type SantaContact = "phone" | "email";

// ---- Läsa (bara namn)

// familyIds: bara Secret Santa i de familjerna (MUPP-080-R4); utan (null) alla
export const entranceEvents = (familyIds: number[] | null = null) =>
  familyIds
    ? all<{ id: number; name: string }>(`SELECT id, name FROM ss_event WHERE family_id IN (${familyIds.map(() => "?").join(",") || "NULL"}) ORDER BY name, id`, familyIds)
    : all<{ id: number; name: string }>("SELECT id, name FROM ss_event ORDER BY name, id");

export async function entranceMembers(eventId: number): Promise<EntranceMember[]> {
  const rows = await all<{ id: number; name: string }>("SELECT id, name FROM ss_member WHERE event_id = ? ORDER BY name, id", [eventId]);
  return rows.map((r) => ({ memberId: r.id, name: r.name }));
}

type MemberRow = { id: number; name: string; event_id: number; event_name: string; amount: number | null; status: EventStatus };
const MEMBER_SQL = "SELECT m.id, m.name, m.event_id, e.name AS event_name, e.amount, e.status FROM ss_member m JOIN ss_event e ON e.id = m.event_id";
const toMember = (row: MemberRow): SantaMember => ({ id: row.id, name: row.name, eventId: row.event_id, eventName: row.event_name, amount: row.amount, status: row.status });

export async function findMember(id: number): Promise<SantaMember | undefined> {
  const row = await get<MemberRow>(`${MEMBER_SQL} WHERE m.id = ?`, [id]);
  return row && toMember(row);
}

// ---- Jämförelsen

// Bara siffror räknas: mellanslag, bindestreck och parenteser ignoreras, och +46 läses som en inledande 0
export function normalizePhone(raw: string) {
  const compact = raw.replace(/[\s\-()]/g, "");
  const national = compact.startsWith("+46") ? `0${compact.slice(3)}` : compact;
  return /^\d+$/.test(national) ? national : null;
}

// Versaler spelar ingen roll i e-postadressen
const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

export function contactMatches(kind: SantaContact, typed: string, saved: { phone: string; email: string }) {
  if (kind === "phone") {
    const phone = normalizePhone(typed);
    return phone !== null && phone === saved.phone;
  }
  return typed.trim() !== "" && normalizeEmail(typed) === normalizeEmail(saved.email);
}

// ---- Inloggningen

type Attempt = { memberId: unknown; kind: unknown; value: unknown };
type SignInResult = { result: "ok"; memberId: number } | { result: "wrong" | "blocked" };

// Samma spärr som sajtlösenordet och adminlösenordet (lib/login-block.ts): försöket skrivs in först, ett fel
// kostar en sekund (wait, 0 i enhetstesterna; testservern hoppar över den, se wrongWait) och ett rätt räknas inte. Vad som var fel sägs aldrig.
export async function checkSantaSignIn(ip: string, input: Attempt, wait = wrongWait()): Promise<SignInResult> {
  const attempt = await beginAttempt(ip);
  if (attempt === null) return { result: "blocked" };
  const memberId = parseId(input.memberId);
  const saved = memberId === null ? undefined : await get<{ phone: string; email: string }>("SELECT phone, email FROM ss_member WHERE id = ?", [memberId]);
  const kind = input.kind === "phone" || input.kind === "email" ? input.kind : null;
  const typed = typeof input.value === "string" && input.value.length <= 254 ? input.value : "";
  if (memberId === null || !saved || kind === null || !contactMatches(kind, typed, saved)) {
    await registerWrong(ip);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return { result: "wrong" };
  }
  await clearAttempt(attempt);
  return { result: "ok", memberId };
}

// ---- Kakan

// Medlemmarna kakan visar att besökaren är inloggad som, en per grupp, den äldsta inloggningen först (MUPP-079-R1). Varje medlem läses ur databasen vid
// varje förfrågan; är hen borttagen gäller hens post inte längre, och inte heller en post från före den årliga rensningen (MUPP-044-R4).
// Det drabbar bara den posten: de andra grupperna fungerar som förut (MUPP-079-R4).
export async function signedInMembers() {
  const entries = verifySantaSessions((await cookies()).get(SANTA_COOKIE)?.value, siteSecrets()?.secret);
  const year = await cleanupYear();
  const current = entries.filter((e) => e.cleanupYear === year).map((e) => e.memberId);
  if (current.length === 0) return [];
  const found = await all<MemberRow>(`${MEMBER_SQL} WHERE m.id IN (${current.map(() => "?").join(",")})`, current);
  const byId = new Map(found.map((row) => [row.id, toMember(row)]));
  // En per grupp hålls av setSantaCookie; skulle kakan ändå ha två (den sätts aldrig så) gäller den senaste
  const perEvent = new Map<number, SantaMember>();
  for (const id of current) {
    const member = byId.get(id);
    if (member) perEvent.set(member.eventId, member);
  }
  return [...perEvent.values()];
}

// Den inloggade medlemmen i gruppen (adressens ?grupp=), eller undefined. Gruppens id väljer bara bland kakans poster och ger aldrig tillträde (MUPP-079-R3).
// Saknas gruppen i adressen och kakan har en enda inloggning är det den, som förut.
export async function currentSantaMember(rawEventId: unknown) {
  const members = await signedInMembers();
  if (rawEventId === undefined) return members.length === 1 ? members[0] : undefined;
  const eventId = parseId(String(rawEventId));
  return eventId === null ? undefined : members.find((m) => m.eventId === eventId);
}

// Lägger till inloggningen i kakan; en tidigare inloggning i samma grupp ersätts (MUPP-055) och de äldsta faller bort efter 10 (MUPP-079-R2)
export async function setSantaCookie(member: SantaMember) {
  const secret = siteSecrets()?.secret;
  if (!secret) return;
  const year = await cleanupYear();
  const kept = (await signedInMembers()).filter((m) => m.eventId !== member.eventId);
  await setSessionCookie(SANTA_COOKIE, joinSantaSessions([...kept, member].map((m) => createSantaSession(secret, m.id, year))), SANTA_SESSION_SECONDS);
}

// Dit en sida skickar den som inte är inloggad i gruppen i adressen: till den gruppens namn, eller till valet av grupp om adressen inte har någon
export function entranceHref(rawEventId: unknown) {
  const eventId = parseId(String(rawEventId));
  return eventId === null ? "/secret-santa" : `/secret-santa?grupp=${eventId}`;
}
