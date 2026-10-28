import "server-only";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_PATH, SESSION_COOKIE, siteSecrets, verifySession } from "./site-session";

// Kontrollen på servern, utöver proxy.ts: sidor, API-rutter och serveråtgärder
// som läser data frågar den igen, så att ett misstag i proxyn inte öppnar sajten.
// En sida kontrollerar i en egen komponent bakom <Suspense> och bygger sitt
// innehåll först efteråt (se app/page.tsx): innehåll som skapats före kontrollen
// följer annars med i det som skickas ut, också när kontrollen sedan stoppar.
export async function hasSiteSession() {
  // Kakans utgångstid jämförs med klockan, så kontrollen hör till själva förfrågan
  await connection();
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value, siteSecrets()?.secret);
}

// För sidor: den som inte har en giltig kaka skickas till lösenordssidan
export async function requireSiteSession() {
  if (!(await hasSiteSession())) redirect(LOGIN_PATH);
}
