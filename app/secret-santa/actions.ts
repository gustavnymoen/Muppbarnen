"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSantaSignIn, clearSantaCookie, setSantaCookie } from "@/lib/santa-auth";
import { openSiteAction } from "@/lib/action-open";
import { clientIp } from "@/lib/request-guard";

const OWN_PAGE = "/secret-santa/min-sida";
type SignInState = { error: string } | null;

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const { refusal } = await openSiteAction();
  if (refusal) return { error: refusal };

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
  const { refusal } = await openSiteAction();
  if (refusal) return;
  await clearSantaCookie();
  redirect("/secret-santa");
}
