import { findChild } from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { readPicture } from "@/lib/pictures";
import { hasSiteSession } from "@/lib/site-auth";

// Barnets bild, bara för den som har sajtkakan (MUPP-009-R4). Bilden ligger i ett privat
// lager och adressen dit lämnar aldrig sajten.
export async function GET(_request: Request, ctx: RouteContext<"/bilder/[id]">) {
  if (!(await hasSiteSession())) return new Response(null, { status: 401 });
  const id = parseId((await ctx.params).id);
  const child = id === null ? undefined : await findChild(id);
  const picture = child?.picture ? await readPicture(child.picture) : null;
  if (!picture) return new Response(null, { status: 404 });
  // no-cache: samma adress visar den nya bilden när den byts, men får sparas privat
  return new Response(picture.body, { headers: { "Content-Type": picture.type, "Cache-Control": "private, no-cache" } });
}
