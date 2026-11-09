"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { claimWishes as claim, unclaimWish as unclaim, type ClaimResult, type UnclaimResult } from "@/lib/family";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { ONBOARDING_COOKIE, onboardingCookieOptions } from "@/lib/onboarding";
import { hasSiteSession } from "@/lib/site-auth";

const REFUSED: ClaimResult = { ok: false, claimed: 0, notClaimed: [], missing: 0 };
const LOGGED_OUT = "Du är utloggad. Ladda om sidan och logga in igen.";

// Paxa önskningar (MUPP-005-R4, -R5). Ordningen är sajtkakan, gränsen för skrivande anrop och sedan reglerna
// i lib/family.ts, som kontrollerar namn och id:n och bara paxar det som är ledigt.
export async function claimWishes(ids: number[], name: string): Promise<ClaimResult> {
  if (!(await hasSiteSession())) return { ...REFUSED, error: LOGGED_OUT };
  const guard = await guardWrite();
  if (guard !== "ok") return { ...REFUSED, error: guardMessage(guard) };
  const result = await claim(ids, name);
  // Visar det som paxats, också när något inte gick: listan ska stämma
  if (result.claimed > 0 || result.notClaimed.length > 0 || result.missing > 0) revalidatePath("/");
  return result;
}

// Ta bort en paxning (MUPP-006), i samma ordning som claimWishes
export async function unclaimWish(id: number): Promise<UnclaimResult> {
  if (!(await hasSiteSession())) return { ok: false, error: LOGGED_OUT };
  const guard = await guardWrite();
  if (guard !== "ok") return { ok: false, error: guardMessage(guard) };
  const result = await unclaim(id);
  // Listan ska visa läget nu, också när någon annan hann ta bort paxningen
  if (!result.error) revalidatePath("/");
  return result;
}

// Minns att besökaren har sett rutan "Så funkar listorna" (MUPP-035-R7). Tar ingen indata: kakans värde är fast.
export async function markOnboardingSeen(): Promise<void> {
  if (!(await hasSiteSession())) return;
  if ((await guardWrite()) !== "ok") return;
  (await cookies()).set(ONBOARDING_COOKIE, "1", onboardingCookieOptions());
}
