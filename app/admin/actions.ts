"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { failed, saved, type FormState } from "@/app/components/form-state";
import { requireAdminSession, setAdminCookie } from "@/lib/admin-auth";
import { ADMIN_PATH } from "@/lib/admin-session";
import * as family from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { detectImageType, MAX_IMAGE_BYTES } from "@/lib/image-type";
import { removePicture, storePicture } from "@/lib/pictures";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { requireSiteSession } from "@/lib/site-auth";

// Adminens serveråtgärder. Varje åtgärd gör samma tre saker först, i den här ordningen
// (specs/rules.md): sajtkakan, adminkakan och gränsen för skrivande anrop. Därefter
// kontrollerar reglerna i lib/family.ts rättigheten (huvudadministratör, eget barn) och indatan.
// Vem som gör det läses ur databasen vid varje anrop, aldrig ur formuläret.

// Svaret efter en ändring: sidorna läses om, och ett fel visas vid formuläret
function answer(formData: FormData, outcome: family.Outcome): FormState {
  if (!outcome.ok) return failed(formData, outcome);
  revalidatePath(ADMIN_PATH, "layout");
  return saved;
}

const text = (formData: FormData, name: string) => formData.get(name);
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

export async function clearList(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  return answer(formData, await family.clearList(parent, text(formData, "childId"), text(formData, "occasion")));
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

const BAD_PICTURE = "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB.";

export async function saveChildPicture(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const guard = await guardWrite();
  if (guard !== "ok") return failed(formData, { error: guardMessage(guard) });
  const child = await family.childForPicture(parent, text(formData, "childId"));
  if (!child) return failed(formData, { error: "Du kan inte göra det här." });

  const file = formData.get("picture");
  if (!(file instanceof File) || file.size === 0) return failed(formData, { fields: { picture: "Välj en bild." } });
  if (file.size > MAX_IMAGE_BYTES) return failed(formData, { fields: { picture: BAD_PICTURE } });
  // Typen avgörs av innehållet, inte av filnamnet eller den typ webbläsaren uppger
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return failed(formData, { fields: { picture: BAD_PICTURE } });

  let stored: string | undefined;
  try {
    stored = await storePicture(child.id, bytes, type);
    await family.setChildPicture(child.id, stored);
  } catch (e) {
    logPictureError(e);
    if (stored) await removePicture(stored).catch(logPictureError);
    return failed(formData, { error: "Bilden kunde inte sparas. Försök igen om en stund." });
  }
  // Den gamla bilden tas bort först när den nya sitter
  if (child.picture) await removePicture(child.picture).catch(logPictureError);
  return answer(formData, { ok: true });
}

// Bara meddelandet loggas, inte hela felet (det kan innehålla adresser till lagret)
function logPictureError(e: unknown) {
  console.error("Bildlagret svarade med ett fel:", e instanceof Error ? e.message : "okänt fel");
}
