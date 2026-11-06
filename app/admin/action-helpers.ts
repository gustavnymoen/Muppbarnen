import { revalidatePath } from "next/cache";
import { failed, saved, type FormState } from "@/app/components/form-state";
import { ADMIN_PATH } from "@/lib/admin-session";
import type * as family from "@/lib/family";

// Det adminens serveråtgärder delar. Ligger för sig för att en "use server"-fil bara får
// exportera åtgärder, och för att bildåtgärden har en egen fil (app/admin/picture-actions.ts).

// Svaret efter en ändring: sidorna läses om, och ett fel visas vid formuläret
export function answer(formData: FormData, outcome: family.Outcome): FormState {
  if (!outcome.ok) return failed(formData, outcome);
  revalidatePath(ADMIN_PATH, "layout");
  return saved;
}

export const text = (formData: FormData, name: string) => formData.get(name);

// Bara meddelandet loggas, inte hela felet (det kan innehålla adresser till lagret)
export function logPictureError(e: unknown) {
  console.error("Bildlagret svarade med ett fel:", e instanceof Error ? e.message : "okänt fel");
}
