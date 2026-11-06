"use server";

import { failed, type FormState } from "@/app/components/form-state";
import { requireAdminSession } from "@/lib/admin-auth";
import * as family from "@/lib/family";
import { detectImageType, MAX_IMAGE_BYTES } from "@/lib/image-type";
import { BadPictureError, storePicture } from "@/lib/picture-upload";
import { removePicture } from "@/lib/pictures";
import { guardMessage, guardWrite } from "@/lib/request-guard";
import { requireSiteSession } from "@/lib/site-auth";
import { answer, logPictureError, text } from "./action-helpers";

// Bildåtgärden ligger för sig, så att bara /admin/hantera (där bilden laddas upp) får med sharp (TECH-016).
// Samma tre kontroller först som i app/admin/actions.ts: sajtkakan, adminkakan, skrivgränsen.

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
  if (!detectImageType(bytes)) return failed(formData, { fields: { picture: BAD_PICTURE } });

  let stored: string | undefined;
  try {
    stored = await storePicture(child.id, bytes);
    await family.setChildPicture(child.id, stored);
  } catch (e) {
    if (e instanceof BadPictureError) return failed(formData, { fields: { picture: BAD_PICTURE } });
    logPictureError(e);
    if (stored) await removePicture(stored).catch(logPictureError);
    return failed(formData, { error: "Bilden kunde inte sparas. Försök igen om en stund." });
  }
  // Den gamla bilden tas bort först när den nya sitter
  if (child.picture) await removePicture(child.picture).catch(logPictureError);
  return answer(formData, { ok: true });
}
