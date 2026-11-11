import { guardWrite } from "@/lib/request-guard";
import { sendListChangeMails } from "@/lib/santa-changes";
import { sendMessageMails } from "@/lib/santa-chat";
import { jobAuthorized } from "@/lib/santa-job";

// Mejlar givarna vars matchning har ändrat sin önskelista (MUPP-042-R3) och dem som fått ett meddelande (MUPP-043-R6). Anropas var tionde minut av .github/workflows/santa-mails.yml
// med SANTA_JOB_SECRET; ingen sajtkaka. Gränsen för skrivande anrop kommer först, så att hemligheten inte går att gissa fram.
// Svaret är bara antal, aldrig vem det gällde.
export async function POST(request: Request) {
  if ((await guardWrite()) !== "ok") return new Response(null, { status: 429 });
  if (!jobAuthorized(request.headers.get("authorization"))) return new Response(null, { status: 401 });
  const lists = await sendListChangeMails();
  const messages = await sendMessageMails();
  return Response.json({ sent: lists.sent + messages.sent, failed: lists.failed + messages.failed });
}
