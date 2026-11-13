"use server";

import { guardMessage, guardWrite } from "@/lib/request-guard";
import { currentSantaMember } from "@/lib/santa-auth";
import { requestNag } from "@/lib/santa-nag";
import { requireSiteSession } from "@/lib/site-auth";

// Tjatknappen (MUPP-071). Först sajtkakan och gränsen för skrivande anrop, sedan vem som är inloggad (ur kakan); anropet har inga
// uppgifter alls, så vem som tjatas på läses ur dragningen (lib/santa-nag.ts). Svaret säger inget om varför ett tjat nekas.
// (Ett namngivet svarstyp: kontrollen i lib/route-checks.test.ts läser funktionens första { som början på kroppen)
export type NagResult = { ok: boolean; error?: string };

export async function nagForList(): Promise<NagResult> {
  await requireSiteSession();
  const guard = await guardWrite();
  if (guard !== "ok") return { ok: false, error: guardMessage(guard) };
  const member = await currentSantaMember();
  return member && (await requestNag(member.id)).ok ? { ok: true } : { ok: false, error: "Du kan inte tjata just nu." };
}
