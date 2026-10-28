import "server-only";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_PATH, adminSecrets, createAdminSession, verifyAdminSession } from "./admin-session";
import { findParent, type Parent } from "./family";

// Kontrollen av adminkakan på servern, utöver proxy.ts: sidor och serveråtgärder under
// admin frågar den igen. Vem som är inloggad som, och om hen är huvudadministratör,
// läses ur databasen vid varje förfrågan och står aldrig i kakan.
export type AdminSession = { expires: number; parent: Parent | null };

// Sessionen om kakan är giltig, annars null. parent är null när ingen förälder är vald
// eller när den valda inte finns längre (valet släpps då).
export async function currentAdmin(): Promise<AdminSession | null> {
  // Kakans utgångstid jämförs med klockan, så kontrollen hör till själva förfrågan
  await connection();
  const session = verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value, adminSecrets()?.secret);
  if (!session) return null;
  return { expires: session.expires, parent: session.parentId > 0 ? ((await findParent(session.parentId)) ?? null) : null };
}

export async function hasAdminSession() {
  return (await currentAdmin()) !== null;
}

// För sidor och åtgärder: utan giltig adminkaka skickas besökaren till inloggningen på /admin
export async function requireAdminSession() {
  const session = await currentAdmin();
  if (!session) redirect(ADMIN_PATH);
  return session;
}

// Kakan efter inloggningen och när föräldern byts. En sessionskaka (ingen Max-Age): den
// försvinner när webbläsaren stängs. Utgångstiden i värdet gäller i 8 timmar.
export async function setAdminCookie(parentId: number, expires?: number) {
  const secret = adminSecrets()?.secret;
  if (!secret) return;
  (await cookies()).set(ADMIN_COOKIE, createAdminSession(secret, parentId, expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
