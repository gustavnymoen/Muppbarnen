import { createHash, timingSafeEqual } from "node:crypto";

// Jobbet som mejlar om ändrade önskelistor (MUPP-042-R3) anropas av ett schemalagt arbetsflöde på GitHub, inte av en besökare:
// det har ingen sajtkaka utan en egen hemlighet i rubriken Authorization (Bearer). Saknas hemligheten, eller är den kortare än
// 32 tecken, är jobbet stängt för alla.
export const SANTA_JOB_PATH = "/api/santa-mails";
const MIN_SECRET_LENGTH = 32;

const hash = (value: string) => createHash("sha256").update(value).digest();

export function jobAuthorized(authorization: string | null, secret = process.env.SANTA_JOB_SECRET) {
  if (!secret || secret.length < MIN_SECRET_LENGTH || !authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(hash(authorization.slice("Bearer ".length)), hash(secret));
}
