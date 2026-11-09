"use server";

import { failed, type FormState } from "@/app/components/form-state";
import { requireAdminSession } from "@/lib/admin-auth";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import * as santa from "@/lib/santa";
import { requireSiteSession } from "@/lib/site-auth";
import { answer, text } from "./action-helpers";

// Secret Santas serveråtgärder (MUPP-038, MUPP-048) för varje förälder: lib/santa.ts kontrollerar att gruppen är förälderns egen (eller att hen är huvudadministratör).
// Samma tre kontroller först som i app/admin/actions.ts: sajtkakan, adminkakan och gränsen för skrivande anrop.

export async function saveEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.saveEvent(parent, { id: text(formData, "eventId") ?? undefined, name: text(formData, "name") }));
}

export async function removeEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.removeEvent(parent, text(formData, "eventId")));
}

// Aktivera och avaktivera (MUPP-051): två åtgärder utan indata utöver gruppen, så att ingen status går att skicka in
export async function activateEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.activateEvent(parent, text(formData, "eventId")));
}

export async function deactivateEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.deactivateEvent(parent, text(formData, "eventId")));
}

export async function addMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await santa.addMember(parent, {
    eventId: text(formData, "eventId"),
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
  });
  return answer(formData, outcome);
}

export async function saveMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await santa.saveMember(parent, {
    memberId: text(formData, "memberId"),
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    partnerId: text(formData, "partnerId"),
  });
  return answer(formData, outcome);
}

export async function removeMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.removeMember(parent, text(formData, "memberId")));
}
