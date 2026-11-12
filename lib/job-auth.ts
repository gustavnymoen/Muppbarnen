import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { guardWrite } from "./request-guard";

// Schemalagda jobb (mejljobbet, MUPP-042, och den årliga rensningen, MUPP-044) anropas av en tjänst, inte av en besökare: de har ingen
// sajtkaka utan en egen hemlighet i rubriken Authorization (Bearer). Saknas hemligheten, eller är den kortare än 32 tecken, är jobbet
// stängt för alla. Båda rutterna öppnas med refuseJobCall.
const MIN_SECRET_LENGTH = 32;

const hash = (value: string) => createHash("sha256").update(value).digest();

export function jobAuthorized(authorization: string | null, secret: string | undefined) {
  if (!secret || secret.length < MIN_SECRET_LENGTH || !authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(hash(authorization.slice("Bearer ".length)), hash(secret));
}

// Det första ett jobb gör: null om anropet får fortsätta, annars svaret som ska skickas. Gränsen för skrivande anrop kommer först,
// så att hemligheten inte går att gissa fram.
export async function refuseJobCall(request: Request, secret: string | undefined) {
  if ((await guardWrite()) !== "ok") return new Response(null, { status: 429 });
  if (!jobAuthorized(request.headers.get("authorization"), secret)) return new Response(null, { status: 401 });
  return null;
}
