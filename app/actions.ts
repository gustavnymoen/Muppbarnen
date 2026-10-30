"use server";

import { revalidatePath } from "next/cache";
import { claimWishes as claim, type ClaimResult } from "@/lib/family";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { hasSiteSession } from "@/lib/site-auth";

const REFUSED: ClaimResult = { ok: false, claimed: 0, notClaimed: [], missing: 0 };

// Paxa önskningar (MUPP-005-R4, -R5). Ordningen är sajtkakan, gränsen för skrivande anrop och sedan reglerna
// i lib/family.ts, som kontrollerar namn och id:n och bara paxar det som är ledigt.
export async function claimWishes(ids: number[], name: string): Promise<ClaimResult> {
  if (!(await hasSiteSession())) return { ...REFUSED, error: "Du är utloggad. Ladda om sidan och logga in igen." };
  const guard = await guardWrite();
  if (guard !== "ok") return { ...REFUSED, error: guardMessage(guard) };
  const result = await claim(ids, name);
  // Visar det som paxats, också när något inte gick: listan ska stämma
  if (result.claimed > 0 || result.notClaimed.length > 0 || result.missing > 0) revalidatePath("/");
  return result;
}
