"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkLogin } from "@/lib/login-block";
import { clientIp, guardMessage, guardWrite } from "@/lib/request-guard";
import { setSessionCookie } from "@/lib/session-cookie";
import { createSession, safeTarget, SESSION_COOKIE, SESSION_SECONDS, siteSecrets } from "@/lib/site-session";

type LoginState = { error: string } | null;

// Den enda åtgärden utan inloggningskontroll (lib/route-checks.test.ts): den är själva inloggningen
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const guard = await guardWrite();
  if (guard !== "ok") return { error: guardMessage(guard) };

  const secrets = siteSecrets();
  if (!secrets) console.error("SITE_PASSWORD eller SITE_SESSION_SECRET saknas, så sajten är stängd för alla");
  const result = await checkLogin(clientIp(await headers()), formData.get("password"), secrets?.password);
  if (result === "blocked") return { error: "För många försök. Försök igen om en stund." };
  if (result === "wrong" || !secrets) return { error: "Fel lösenord." };

  await setSessionCookie(SESSION_COOKIE, createSession(secrets.secret), SESSION_SECONDS);
  redirect(safeTarget(formData.get("till")));
}
