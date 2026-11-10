import { timingSafeEqual } from "node:crypto";
import { runCleanup } from "@/lib/santa-cleanup";
import { parseDate } from "@/lib/deck";

// Den årliga rensningen av Secret Santa (MUPP-044), anropad en gång om dagen av Vercel Cron (vercel.json). Ingen besökare är
// inloggad här; i stället krävs hemligheten CRON_SECRET, som Vercel skickar som "Authorization: Bearer <hemligheten>". Utan
// hemligheten i miljön svarar rutten alltid 401. Proxyn släpper igenom sökvägen (proxy.ts) och det här är den enda kontrollen.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) return new Response(null, { status: 401 });
  // Testservern anger ett eget datum (SANTA_CLEANUP_TODAY, ÅÅÅÅ-MM-DD) för att kunna köra rensningen när som helst; aldrig på Vercel
  const fixed = process.env.VERCEL ? undefined : process.env.SANTA_CLEANUP_TODAY;
  return Response.json(await runCleanup(fixed ? parseDate(fixed) : undefined));
}
