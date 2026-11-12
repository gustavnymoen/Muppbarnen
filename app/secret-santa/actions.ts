"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSantaSignIn, clearSantaCookie, setSantaCookie } from "@/lib/santa-auth";
import { clientIp, guardMessage, guardWrite } from "@/lib/request-guard";
import { requireSiteSession } from "@/lib/site-auth";

const OWN_PAGE = "/secret-santa/min-sida";
type SignInState = { error: string } | null;

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  await requireSiteSession();
  const guard = await guardWrite();
  if (guard !== "ok") return { error: guardMessage(guard) };

  const outcome = await checkSantaSignIn(clientIp(await headers()), {
    memberId: formData.get("memberId"),
    kind: formData.get("kind"),
    value: formData.get("value"),
  });
  if (outcome.result !== "ok") return { error: outcome.result === "blocked" ? "För många försök. Försök igen om en stund." : "Det stämde inte" };

  await setSantaCookie(outcome.memberId);
  redirect(OWN_PAGE);
}

// Pilen på den egna sidan: kakan tas bort och besökaren går tillbaka till valet av grupp (MUPP-055)
export async function leave() {
  await requireSiteSession();
  if ((await guardWrite()) !== "ok") return;
  await clearSantaCookie();
  redirect("/secret-santa");
}
