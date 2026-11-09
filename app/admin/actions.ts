"use server";

import { redirect } from "next/navigation";
import { failed, type FormState } from "@/app/components/form-state";
import { requireAdminSession, setAdminCookie } from "@/lib/admin-auth";
import { ADMIN_PATH } from "@/lib/admin-session";
import * as family from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { removePicture } from "@/lib/pictures";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { requireSiteSession } from "@/lib/site-auth";
import { answer, logPictureError, text } from "./action-helpers";

// Adminens serveråtgärder. Varje åtgärd gör samma tre saker först, i den här ordningen
// (specs/rules.md): sajtkakan, adminkakan och gränsen för skrivande anrop. Därefter
// kontrollerar reglerna i lib/family.ts rättigheten (huvudadministratör, eget barn) och indatan.
// Vem som gör det läses ur databasen vid varje anrop, aldrig ur formuläret.

const checked = (formData: FormData, name: string) => formData.get(name) === "on";

// ---- Vem är jag

export async function chooseParent(formData: FormData) {
  await requireSiteSession();
  const admin = await requireAdminSession();
  if ((await guardWrite()) !== "ok") return;
  const id = parseId(formData.get("parentId"));
  const parent = id === null ? undefined : await family.findParent(id);
  // Utgångstiden behålls: att byta förälder förlänger inte inloggningen
  if (parent) await setAdminCookie(parent.id, admin.expires);
}

export async function leaveParent() {
  await requireSiteSession();
  const admin = await requireAdminSession();
  if ((await guardWrite()) !== "ok") return;
  await setAdminCookie(0, admin.expires);
}

export async function createMaster(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const admin = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.createFirstMaster(text(formData, "name"));
  if (!outcome.ok) return failed(formData, outcome);
  await setAdminCookie(outcome.id, admin.expires);
  redirect(ADMIN_PATH);
}

// ---- Storlekar och önskelistor

export async function saveSizes(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.saveSizes(parent, text(formData, "childId"), {
    clothes: text(formData, "clothes"),
    shoes: text(formData, "shoes"),
    head: text(formData, "head"),
    gloves: text(formData, "gloves"),
  });
  return answer(formData, outcome);
}

export async function saveItem(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.saveItem(parent, {
    childId: text(formData, "childId"),
    occasion: text(formData, "occasion"),
    itemId: text(formData, "itemId") ?? undefined,
    title: text(formData, "title"),
    size: text(formData, "size"),
    description: text(formData, "description"),
    url: text(formData, "url"),
    unlimited: checked(formData, "unlimited"),
  });
  return answer(formData, outcome);
}

export async function removeItem(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await family.removeItem(parent, text(formData, "itemId")));
}

// Lägger en arkiverad önskning i barnets födelsedags- eller jullista igen (MUPP-031-R7); listan är knappen som trycktes
export async function copyArchivedItem(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await family.copyArchivedItem(parent, text(formData, "itemId"), text(formData, "occasion")));
}

// ---- Föräldrar, barn och bilder (huvudadministratören)

export async function saveParent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.saveParent(parent, {
    id: text(formData, "parentId") ?? undefined,
    name: text(formData, "name"),
    isMasterAdmin: checked(formData, "isMasterAdmin"),
  });
  return answer(formData, outcome);
}

export async function removeParent(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await family.removeParent(parent, text(formData, "parentId")));
}

export async function saveChild(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.saveChild(parent, {
    id: text(formData, "childId") ?? undefined,
    name: text(formData, "name"),
    birthdate: text(formData, "birthdate"),
    parentId: text(formData, "parentId"),
  });
  return answer(formData, outcome);
}

export async function removeChild(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.removeChild(parent, text(formData, "childId"));
  if (outcome.ok && outcome.picture) await removePicture(outcome.picture).catch(logPictureError);
  return answer(formData, outcome);
}

export async function removeChildPicture(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const outcome = await family.clearChildPicture(parent, text(formData, "childId"));
  // Filen tas bort först när databasen är uppdaterad
  if (outcome.ok && outcome.picture) await removePicture(outcome.picture).catch(logPictureError);
  return answer(formData, outcome);
}
