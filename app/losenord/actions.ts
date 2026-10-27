"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { registerAttempt } from "@/lib/login-attempts";
import { createSession, passwordMatches, safeTarget, SESSION_COOKIE, SESSION_SECONDS, siteSecrets } from "@/lib/site-session";

export type LoginState = { error: string } | null;

// På Vercel sätter plattformen x-real-ip själv och skriver över det klienten skickar
function clientIp(h: Headers) {
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "okänd";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  // Försöket räknas innan lösenordet kontrolleras
  if (!(await registerAttempt(clientIp(await headers())))) {
    return { error: "För många försök. Försök igen om en stund." };
  }

  const secrets = siteSecrets();
  if (!secrets) console.error("SITE_PASSWORD eller SITE_SESSION_SECRET saknas, så sajten är stängd för alla");
  const password = formData.get("password");

  if (!secrets || typeof password !== "string" || !passwordMatches(password, secrets.password)) {
    // Ett fel lösenord kostar en sekund
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Fel lösenord." };
  }

  (await cookies()).set(SESSION_COOKIE, createSession(secrets.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
  redirect(safeTarget(formData.get("till")));
}
