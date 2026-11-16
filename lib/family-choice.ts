// Besökarens val av familjer (MUPP-080): kakan och vad den betyder. Bara data in och ut, så att det går att testa utan databas.
// Kakan är en filtrering av det som visas, inte ett skydd: alla har samma sajtlösenord och kan välja vilken familj som helst.

// Prefixet __Host- i produktion av samma skäl som sajtkakan (lib/site-session.ts)
export const FAMILY_COOKIE = process.env.NODE_ENV === "production" ? "__Host-families" : "families";
// Kakan gäller i ett år
export const FAMILY_SECONDS = 365 * 24 * 60 * 60;

export const familyCookieOptions = (production = process.env.NODE_ENV === "production") => ({
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  maxAge: FAMILY_SECONDS,
  path: "/",
});

// "all": Alla (inget filter, också familjer som tillkommer); en lista med id:n; null: inget val gjort
export type FamilyChoice = "all" | number[] | null;

// Kakans text: "all", eller id:n med komma emellan ("1,3"). Allt annat är inget val.
export function parseChoice(raw: string | undefined): FamilyChoice {
  if (raw === "all") return "all";
  if (!raw || !/^\d{1,15}(,\d{1,15})*$/.test(raw)) return null;
  const ids = [...new Set(raw.split(",").map(Number))].filter((id) => id > 0);
  return ids.length > 0 ? ids : null;
}

export const serializeChoice = (choice: Exclude<FamilyChoice, null>) => (choice === "all" ? "all" : choice.join(","));

export type FamilyView =
  // Färre än två familjer: inget val behövs och allt visas
  | { kind: "single" }
  // Två eller fler och inget (giltigt) val: ghostkortet
  | { kind: "choose" }
  // ids: null betyder Alla (inget filter)
  | { kind: "chosen"; ids: number[] | null; choice: "all" | number[] };

// Vad valet betyder med de familjer som finns. Id:n som inte finns längre räknas bort (MUPP-080-R6); är inget kvar är det inget val.
export function resolveChoice(choice: FamilyChoice, existing: number[]): FamilyView {
  if (existing.length < 2) return { kind: "single" };
  if (choice === "all") return { kind: "chosen", ids: null, choice };
  const ids = (choice ?? []).filter((id) => existing.includes(id));
  return ids.length > 0 ? { kind: "chosen", ids, choice: ids } : { kind: "choose" };
}
