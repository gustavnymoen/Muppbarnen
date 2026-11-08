"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failed, saved, type FormState } from "@/app/components/form-state";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { currentSantaPerson } from "@/lib/santa-auth";
import * as wishes from "@/lib/santa-wishes";
import { requireSiteSession } from "@/lib/site-auth";
import type { Outcome } from "@/lib/family";

// Önskelistans serveråtgärder (MUPP-040). Först sajtkakan och gränsen för skrivande anrop, sedan vem som är
// inloggad (ur kakan, aldrig ur formuläret); reglerna i lib/santa-wishes.ts kontrollerar att listan är hens egen.

const OWN_PAGE = "/secret-santa/min-sida";
const field = (formData: FormData, name: string) => formData.get(name);

export async function saveWish(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const person = await ownPerson();
  const wishId = field(formData, "wishId");
  return answer(
    formData,
    await wishes.saveWish(person.id, {
      familyId: field(formData, "familyId"),
      wishId: wishId ?? undefined,
      title: field(formData, "title"),
      size: field(formData, "size"),
      description: field(formData, "description"),
      url: field(formData, "url"),
    }),
  );
}

export async function removeWish(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const person = await ownPerson();
  return answer(formData, await wishes.removeWish(person.id, field(formData, "wishId")));
}

// Den inloggade personen ur kakan; utan den går besökaren till ingången
async function ownPerson() {
  const person = await currentSantaPerson();
  if (!person) redirect("/secret-santa");
  return person;
}

function answer(formData: FormData, outcome: Outcome): FormState {
  if (!outcome.ok) return failed(formData, outcome);
  revalidatePath(OWN_PAGE);
  return saved;
}
