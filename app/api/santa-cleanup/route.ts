import { refuseJobCall } from "@/lib/job-auth";
import { runCleanup } from "@/lib/santa-cleanup";
import { parseDate } from "@/lib/deck";

// Den årliga rensningen av Secret Santa (MUPP-044), anropad en gång om dagen av Vercel Cron (vercel.json). Ingen besökare är
// inloggad här; i stället krävs hemligheten CRON_SECRET, som Vercel skickar som "Authorization: Bearer <hemligheten>". Utan
// hemligheten i miljön, eller med en kortare än 32 tecken, svarar rutten alltid 401 (lib/job-auth.ts). Proxyn släpper igenom sökvägen (proxy.ts) och det här är den enda kontrollen.
export async function GET(request: Request) {
  const refused = await refuseJobCall(request, process.env.CRON_SECRET);
  if (refused) return refused;
  // Testservern anger ett eget datum (SANTA_CLEANUP_TODAY, ÅÅÅÅ-MM-DD) för att kunna köra rensningen när som helst; aldrig på Vercel
  const fixed = process.env.VERCEL ? undefined : process.env.SANTA_CLEANUP_TODAY;
  return Response.json(await runCleanup(fixed ? parseDate(fixed) : undefined));
}
