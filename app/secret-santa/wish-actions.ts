"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failed, saved, type FormState } from "@/app/components/form-state";
import { openSiteAction } from "@/lib/action-open";
import { currentSantaMember } from "@/lib/santa-auth";
import * as wishes from "@/lib/santa-wishes";
import type { Outcome } from "@/lib/family";

// Önskelistans serveråtgärder (MUPP-040). Först sajtkakan och gränsen för skrivande anrop, sedan vem som är
// inloggad (ur kakan, aldrig ur formuläret); reglerna i lib/santa-wishes.ts kontrollerar att önskningen är hens egen.

const OWN_PAGE = "/secret-santa/min-sida/onskelista";
const field = (formData: FormData, name: string) => formData.get(name);

export async function saveWish(_previous: FormState, formData: FormData): Promise<FormState> {
  const { refusal } = await openSiteAction();
  if (refusal) return failed(formData, { error: refusal });
  const member = await ownMember();
  const wishId = field(formData, "wishId");
  return answer(
    formData,
    await wishes.saveWish(member.id, {
      wishId: wishId ?? undefined,
      title: field(formData, "title"),
      size: field(formData, "size"),
      description: field(formData, "description"),
      url: field(formData, "url"),
    }),
  );
}

export async function removeWish(_previous: FormState, formData: FormData): Promise<FormState> {
  const { refusal } = await openSiteAction();
  if (refusal) return failed(formData, { error: refusal });
  const member = await ownMember();
  return answer(formData, await wishes.removeWish(member.id, field(formData, "wishId")));
}

// Den inloggade medlemmen ur kakan; utan den går besökaren till ingången
async function ownMember() {
  const member = await currentSantaMember();
  if (!member) redirect("/secret-santa");
  return member;
}

function answer(formData: FormData, outcome: Outcome): FormState {
  if (!outcome.ok) return failed(formData, outcome);
  revalidatePath(OWN_PAGE);
  return saved;
}
