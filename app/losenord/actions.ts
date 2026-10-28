"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { beginAttempt, clearAttempt, registerWrong } from "@/lib/login-block";
import { clientIp, guardWrite } from "@/lib/request-guard";
import { createSession, passwordMatches, safeTarget, SESSION_COOKIE, SESSION_SECONDS, siteSecrets } from "@/lib/site-session";

export type LoginState = { error: string } | null;

// Den enda åtgärden utan inloggningskontroll (lib/route-checks.test.ts): den är själva inloggningen
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const guard = await guardWrite();
  if (guard === "origin") return { error: "Något gick fel. Ladda om sidan och försök igen." };
  if (guard === "limit") return { error: "För många förfrågningar. Försök igen om en stund." };

  // Försöket skrivs in innan lösenordet kontrolleras och tas bort om det var rätt
  const ip = clientIp(await headers());
  const attempt = await beginAttempt(ip);
  if (attempt === null) return { error: "För många försök. Försök igen om en stund." };

  const secrets = siteSecrets();
  if (!secrets) console.error("SITE_PASSWORD eller SITE_SESSION_SECRET saknas, så sajten är stängd för alla");
  const password = formData.get("password");

  if (!secrets || typeof password !== "string" || !passwordMatches(password, secrets.password)) {
    await registerWrong(ip);
    // Ett fel lösenord kostar en sekund
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Fel lösenord." };
  }

  await clearAttempt(attempt);
  (await cookies()).set(SESSION_COOKIE, createSession(secrets.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
  redirect(safeTarget(formData.get("till")));
}
