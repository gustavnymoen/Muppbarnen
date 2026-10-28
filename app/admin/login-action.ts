"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/components/form-state";
import { ADMIN_PATH, adminSecrets } from "@/lib/admin-session";
import { setAdminCookie } from "@/lib/admin-auth";
import { checkLogin } from "@/lib/login-block";
import { clientIp, guardMessage, guardWrite } from "@/lib/request-guard";
import { requireSiteSession } from "@/lib/site-auth";

// Den enda adminåtgärden utan adminkontroll (lib/route-checks.test.ts): den är själva
// inloggningen. Sajtkakan krävs som för allt annat, och spärren efter fel lösenord är
// gemensam med sajtlösenordet.
export async function adminLogin(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireSiteSession();
  const guard = await guardWrite();
  if (guard !== "ok") return { error: guardMessage(guard) };

  const secrets = adminSecrets();
  if (!secrets) {
    console.error("ADMIN_PASSWORD eller ADMIN_SESSION_SECRET saknas, så admin är stängd för alla");
    return { error: "Det går inte att logga in just nu." };
  }
  const result = await checkLogin(clientIp(await headers()), formData.get("password"), secrets.password);
  if (result === "blocked") return { fields: { password: "För många försök. Försök igen om en stund." } };
  if (result === "wrong") return { fields: { password: "Fel lösenord." } };

  await setAdminCookie(0);
  redirect(ADMIN_PATH);
}
