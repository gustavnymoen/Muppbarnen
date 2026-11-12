import "server-only";
import { cookies } from "next/headers";
import { all, get } from "./db";
import { beginAttempt, clearAttempt, registerWrong, wrongWait } from "./login-block";
import { parseId } from "./form-input";
import type { EventStatus } from "./santa";
import { cleanupYear } from "./santa-cleanup";
import { setSessionCookie } from "./session-cookie";
import { createSantaSession, SANTA_COOKIE, SANTA_SESSION_SECONDS, verifySantaSession } from "./santa-session";
import { siteSecrets } from "./site-session";

// Ingången till Secret Santa (MUPP-039): vad besökaren får se innan hen loggat in (bara namn),
// kontrollen av telefon eller e-post, och vem som är inloggad. Telefon och e-post läses bara här,
// för kontrollen, och lämnar aldrig funktionen. Designen: wiki/system/secret-santa-entrance.md.

type EntranceMember = { memberId: number; name: string };
export type SantaMember = { id: number; name: string; eventId: number; eventName: string; status: EventStatus };
type SantaContact = "phone" | "email";

// ---- Läsa (bara namn)

export const entranceEvents = () => all<{ id: number; name: string }>("SELECT id, name FROM ss_event ORDER BY name, id");

export async function entranceMembers(eventId: number): Promise<EntranceMember[]> {
  const rows = await all<{ id: number; name: string }>("SELECT id, name FROM ss_member WHERE event_id = ? ORDER BY name, id", [eventId]);
  return rows.map((r) => ({ memberId: r.id, name: r.name }));
}

export async function findMember(id: number): Promise<SantaMember | undefined> {
  const row = await get<{ id: number; name: string; event_id: number; event_name: string; status: EventStatus }>(
    "SELECT m.id, m.name, m.event_id, e.name AS event_name, e.status FROM ss_member m JOIN ss_event e ON e.id = m.event_id WHERE m.id = ?",
    [id],
  );
  return row && { id: row.id, name: row.name, eventId: row.event_id, eventName: row.event_name, status: row.status };
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

// Den inloggade medlemmen, eller null. Medlemmen läses ur databasen vid varje förfrågan; är hen borttagen gäller kakan inte längre,
// och inte heller en kaka från före den årliga rensningen (MUPP-044-R4).
export async function currentSantaMember() {
  const session = verifySantaSession((await cookies()).get(SANTA_COOKIE)?.value, siteSecrets()?.secret);
  if (session === null || session.cleanupYear !== (await cleanupYear())) return null;
  return (await findMember(session.memberId)) ?? null;
}

export async function setSantaCookie(memberId: number) {
  const secret = siteSecrets()?.secret;
  if (!secret) return;
  await setSessionCookie(SANTA_COOKIE, createSantaSession(secret, memberId, await cleanupYear()), SANTA_SESSION_SECONDS);
}

// Tas bort med samma regler som när den sattes: en __Host-kaka utan Secure godtas inte ens för att tömmas
export async function clearSantaCookie() {
  await setSessionCookie(SANTA_COOKIE, "", 0);
}
