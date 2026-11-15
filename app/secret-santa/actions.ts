"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSantaSignIn, findMember, setSantaCookie } from "@/lib/santa-auth";
import { openSiteAction } from "@/lib/action-open";
import { clientIp } from "@/lib/request-guard";

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

  const member = await findMember(outcome.memberId);
  if (!member) return { error: "Det stämde inte" };
  await setSantaCookie(member);
  redirect(`/secret-santa/min-sida?grupp=${member.eventId}`);
}
