"use server";

import { failed, type FormState } from "@/app/components/form-state";
import { requireAdminSession } from "@/lib/admin-auth";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import * as santa from "@/lib/santa";
import { requireSiteSession } from "@/lib/site-auth";
import { answer, text } from "./action-helpers";

// Secret Santas serveråtgärder (MUPP-038), bara för huvudadministratören: lib/santa.ts kontrollerar rättigheten.
// Samma tre kontroller först som i app/admin/actions.ts: sajtkakan, adminkakan och gränsen för skrivande anrop.

export async function saveFamily(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.saveFamily(parent, { id: text(formData, "familyId") ?? undefined, name: text(formData, "name") }));
}

export async function removeFamily(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.removeFamily(parent, text(formData, "familyId")));
}

export async function addNewMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await santa.addNewMember(parent, {
    familyId: text(formData, "familyId"),
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
  });
  return answer(formData, outcome);
}

export async function joinFamily(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await santa.joinFamily(parent, { familyId: text(formData, "familyId"), personId: text(formData, "personId") }));
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
