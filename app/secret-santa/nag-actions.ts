"use server";

import { openSiteAction } from "@/lib/action-open";
import { currentSantaMember } from "@/lib/santa-auth";
import { requestNag } from "@/lib/santa-nag";

// Tjatknappen (MUPP-071). Först sajtkakan och gränsen för skrivande anrop (openSiteAction), sedan vem som är inloggad (ur kakan); anropet har
// inga uppgifter alls, så vem som tjatas på läses ur dragningen (lib/santa-nag.ts). Svaret säger inget om varför ett tjat nekas.
// (Ett namngivet svarstyp: kontrollen i lib/route-checks.test.ts läser funktionens första { som början på kroppen)
export type NagResult = { ok: boolean; error?: string };

export async function nagForList(): Promise<NagResult> {
  const { refusal } = await openSiteAction();
  if (refusal) return { ok: false, error: refusal };
  const member = await currentSantaMember();
  return member && (await requestNag(member.id)).ok ? { ok: true } : { ok: false, error: "Du kan inte tjata just nu." };
}
