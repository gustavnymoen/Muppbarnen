import "server-only";
import { cookies } from "next/headers";
import { all, get } from "./db";
import { beginAttempt, clearAttempt, registerWrong, wrongWait } from "./login-block";
import { parseId } from "./form-input";
import { createSantaSession, SANTA_COOKIE, SANTA_SESSION_SECONDS, verifySantaSession } from "./santa-session";
import { siteSecrets } from "./site-session";

// Ingången till Secret Santa (MUPP-039): vad besökaren får se innan hen loggat in (bara namn),
// kontrollen av telefon eller e-post, och vem som är inloggad. Telefon och e-post läses bara här,
// för kontrollen, och lämnar aldrig funktionen. Designen: wiki/system/secret-santa-entrance.md.

export type EntranceMember = { personId: number; name: string };
export type SantaPerson = { id: number; name: string };
export type SantaContact = "phone" | "email";

// ---- Läsa (bara namn)

export const entranceFamilies = () => all<{ id: number; name: string }>("SELECT id, name FROM ss_family ORDER BY name, id");

export async function entranceMembers(familyId: number): Promise<EntranceMember[]> {
  const rows = await all<{ id: number; name: string }>(
    "SELECT p.id, p.name FROM ss_member m JOIN ss_person p ON p.id = m.person_id WHERE m.family_id = ? ORDER BY p.name, p.id",
    [familyId],
  );
  return rows.map((r) => ({ personId: r.id, name: r.name }));
}

export const findPerson = (id: number) => get<SantaPerson>("SELECT id, name FROM ss_person WHERE id = ?", [id]);

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

type Attempt = { personId: unknown; kind: unknown; value: unknown };
type SignInResult = { result: "ok"; personId: number } | { result: "wrong" | "blocked" };

// Samma spärr som sajtlösenordet och adminlösenordet (lib/login-block.ts): försöket skrivs in först, ett fel
// kostar en sekund (wait, 0 i enhetstesterna; testservern hoppar över den, se wrongWait) och ett rätt räknas inte. Vad som var fel sägs aldrig.
export async function checkSantaSignIn(ip: string, input: Attempt, wait = wrongWait()): Promise<SignInResult> {
  const attempt = await beginAttempt(ip);
  if (attempt === null) return { result: "blocked" };
  const personId = parseId(input.personId);
  const saved = personId === null ? undefined : await get<{ phone: string; email: string }>("SELECT phone, email FROM ss_person WHERE id = ?", [personId]);
  const kind = input.kind === "phone" || input.kind === "email" ? input.kind : null;
  const typed = typeof input.value === "string" && input.value.length <= 254 ? input.value : "";
  if (personId === null || !saved || kind === null || !contactMatches(kind, typed, saved)) {
    await registerWrong(ip);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return { result: "wrong" };
  }
  await clearAttempt(attempt);
  return { result: "ok", personId };
}

// ---- Kakan

// Den inloggade personen, eller null. Personen läses ur databasen vid varje förfrågan; är hen borttagen gäller kakan inte längre.
export async function currentSantaPerson() {
  const id = verifySantaSession((await cookies()).get(SANTA_COOKIE)?.value, siteSecrets()?.secret);
  return id === null ? null : ((await findPerson(id)) ?? null);
}

const cookieRules = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" } as const;

export async function setSantaCookie(personId: number) {
  const secret = siteSecrets()?.secret;
  if (!secret) return;
  (await cookies()).set(SANTA_COOKIE, createSantaSession(secret, personId), { ...cookieRules, maxAge: SANTA_SESSION_SECONDS });
}

// Tas bort med samma regler som när den sattes: en __Host-kaka utan Secure godtas inte ens för att tömmas
export async function clearSantaCookie() {
  (await cookies()).set(SANTA_COOKIE, "", { ...cookieRules, maxAge: 0 });
}
