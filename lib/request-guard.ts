import "server-only";
import { headers } from "next/headers";
import { registerWrite } from "./write-limit";

// På Vercel sätter plattformen x-real-ip själv och skriver över det klienten skickar
export function clientIp(h: Headers) {
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "okänd";
}

// Förfrågan kommer från sajten själv: Origin (som webbläsaren alltid skickar med
// vid POST från en annan sajt) pekar på samma värd. Saknas Origin kommer anropet
// inte från en webbläsare och kan inte vara en CSRF-attack.
export function originMatches(origin: string | null, host: string | null) {
  if (origin === null) return true;
  try {
    return host !== null && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type WriteGuard = "ok" | "origin" | "limit";

// Det första en skrivande rutt eller serveråtgärd gör efter inloggningskontrollen
// (specs/rules.md): kommer anropet från sajten själv, och är adressen under
// gränsen för skrivande anrop? Kontrollen i lib/route-checks.test.ts kräver anropet.
export async function guardWrite(): Promise<WriteGuard> {
  const h = await headers();
  if (!originMatches(h.get("origin"), h.get("x-forwarded-host") ?? h.get("host"))) return "origin";
  return (await registerWrite(clientIp(h))) ? "ok" : "limit";
}

// Texten som en åtgärd visar när guardWrite() sa nej
export const guardMessage = (guard: Exclude<WriteGuard, "ok">) =>
  guard === "origin" ? "Något gick fel. Ladda om sidan och försök igen." : "För många förfrågningar. Försök igen om en stund.";
