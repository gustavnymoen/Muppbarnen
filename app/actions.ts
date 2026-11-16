"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { addVisitorGift, claimWishes as claim, removeAddedGift as removeGift, unclaimWish as unclaim, type ClaimResult, type Outcome, type UnclaimResult } from "@/lib/family";
import { failed, saved, type FormState } from "@/app/components/form-state";
import { checkFamilyIds } from "@/lib/families";
import { FAMILY_COOKIE, familyCookieOptions, serializeChoice } from "@/lib/family-choice";
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

// Ta bort en present som en besökare lagt till (MUPP-077-R5), i samma ordning
export async function removeAddedGift(id: number): Promise<UnclaimResult> {
  if (!(await hasSiteSession())) return { ok: false, error: LOGGED_OUT };
  const guard = await guardWrite();
  if (guard !== "ok") return { ok: false, error: guardMessage(guard) };
  const result = await removeGift(id);
  if (!result.error) revalidatePath("/");
  return result;
}

// Lägg till en present som inte stod i listan (MUPP-077-R4, R7): sajtkakan, gränsen för skrivande anrop, sedan reglerna i lib/family.ts
export async function addGift(input: { childId: number; occasion: string; title: string; size: string; description: string; url: string; name: string }): Promise<Outcome> {
  if (!(await hasSiteSession())) return { ok: false, error: LOGGED_OUT };
  const guard = await guardWrite();
  if (guard !== "ok") return { ok: false, error: guardMessage(guard) };
  const result = await addVisitorGift(input);
  if (result.ok) revalidatePath("/");
  return result;
}

// Minns att besökaren har sett rutan "Så funkar det" (MUPP-035-R7). Tar ingen indata: kakans värde är fast.
export async function markOnboardingSeen(): Promise<void> {
  if (!(await hasSiteSession())) return;
  if ((await guardWrite()) !== "ok") return;
  (await cookies()).set(ONBOARDING_COOKIE, "1", onboardingCookieOptions());
}

// Besökarens val av familjer (MUPP-080-R1, R6): "Alla" eller en eller flera familjer, i en kaka på enheten. Sajtkakan och gränsen för
// skrivande anrop först; id:n kontrolleras som heltal som finns. Alla och familjer samtidigt (utan script) räknas som Alla.
export async function chooseFamilies(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!(await hasSiteSession())) return failed(formData, { error: LOGGED_OUT });
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const all = formData.get("all") === "on";
  const picked = [...formData.entries()].flatMap(([key, value]) => (key.startsWith("family-") && value === "on" ? [key.slice("family-".length)] : []));
  const ids = all ? [] : await checkFamilyIds(picked);
  if (!ids || (!all && ids.length === 0)) return failed(formData, { fields: { families: "Välj minst en familj, eller Alla." } });
  (await cookies()).set(FAMILY_COOKIE, serializeChoice(all ? "all" : ids), familyCookieOptions());
  // Startsidan och Secret Santa visar olika saker nu
  revalidatePath("/", "layout");
  return saved;
}
