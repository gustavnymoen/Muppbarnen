import { findChild } from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { pictureVersion } from "@/lib/picture-url";
import { readPicture } from "@/lib/pictures";
import { hasSiteSession } from "@/lib/site-auth";

// Barnets bild, bara för den som har sajtkakan (MUPP-009-R4). Bilden ligger i ett privat
// lager och adressen dit lämnar aldrig sajten.
export async function GET(request: Request, ctx: RouteContext<"/bilder/[id]">) {
  if (!(await hasSiteSession())) return new Response(null, { status: 401 });
  const id = parseId((await ctx.params).id);
  const child = id === null ? undefined : await findChild(id);
  if (!child?.picture) return new Response(null, { status: 404 });
  // Filnamnet är nytt varje gång bilden byts, så det duger som ETag: en oförändrad bild läses aldrig ur lagret igen (TECH-011).
  // 304 före readPicture är avsiktligt: ETag:en matchar bara ett namn som webbläsaren redan fått. Ändras ETag:en av en proxy (W/"…") slår jämförelsen fel och hela bilden skickas, vilket är säkert.
  // Med rätt version i adressen (MUPP-024) sparas bilden privat för alltid; en ny bild ger ny adress. Utan version, eller med en gammal, hämtas den om vid varje visning.
  const versioned = new URL(request.url).searchParams.get("v") === pictureVersion(child.picture);
  const headers = { ETag: `"${child.picture}"`, "Cache-Control": versioned ? "private, max-age=31536000, immutable" : "private, no-cache" };
  if (request.headers.get("if-none-match") === headers.ETag) return new Response(null, { status: 304, headers });
  const picture = await readPicture(child.picture);
  return picture ? new Response(picture.body, { headers: { ...headers, "Content-Type": picture.type } }) : new Response(null, { status: 404 });
}
