import "server-only";
import { requireAdminSession } from "./admin-auth";
import { guardMessage, guardWrite } from "./request-guard";
import { requireSiteSession } from "./site-auth";

// Det en serveråtgärd gör först, i den här ordningen (specs/rules.md): sajtkakan, för adminåtgärder adminkakan, och gränsen för
// skrivande anrop. Skrivs här en gång; lib/route-checks.test.ts kräver att varje åtgärd öppnar med en av dem.
// refusal är texten att visa när gränsen eller Origin-kontrollen sa nej, annars null.
const refusalOf = async () => {
  const guard = await guardWrite();
  return guard === "ok" ? null : guardMessage(guard);
};

export async function openSiteAction() {
  await requireSiteSession();
  return { refusal: await refusalOf() };
}

export async function openAdminAction() {
  await requireSiteSession();
  const admin = await requireAdminSession();
  return { admin, parent: admin.parent, refusal: await refusalOf() };
}
