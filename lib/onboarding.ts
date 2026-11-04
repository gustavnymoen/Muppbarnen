// Kakan som minns att besökaren har sett rutan "Så funkar sajten" (MUPP-035-R7). Den innehåller inget om personen,
// bara att rutan är sedd. Prefixet __Host- i produktion av samma skäl som sajtkakan (lib/site-session.ts).
export const ONBOARDING_COOKIE = process.env.NODE_ENV === "production" ? "__Host-onboarding" : "onboarding";
// Kakan gäller i ett år
export const ONBOARDING_SECONDS = 365 * 24 * 60 * 60;

export const onboardingCookieOptions = (production = process.env.NODE_ENV === "production") => ({
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  maxAge: ONBOARDING_SECONDS,
  path: "/",
});
