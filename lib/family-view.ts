import "server-only";
import { cookies } from "next/headers";
import { listFamilies } from "./families";
import { FAMILY_COOKIE, parseChoice, resolveChoice, type FamilyView } from "./family-choice";

export type FamilyOption = { id: number; name: string; description: string };

// Familjerna besökaren kan välja bland och vad valet i kakan betyder (MUPP-080). Läses av startsidan och Secret Santa på servern,
// så att det som inte ska visas aldrig skickas till webbläsaren.
export async function familyView(): Promise<{ families: FamilyOption[]; view: FamilyView }> {
  const families = (await listFamilies()).map(({ id, name, description }) => ({ id, name, description }));
  const choice = parseChoice((await cookies()).get(FAMILY_COOKIE)?.value);
  return { families, view: resolveChoice(choice, families.map((f) => f.id)) };
}
