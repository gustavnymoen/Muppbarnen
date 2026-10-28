import "server-only";
import { get, run } from "./db";

// Gräns för skrivande anrop per IP-adress (TECH-005): högst 60 i minuten, så att
// databasen inte kan översvämmas från en adress. Räkningen ligger i databasen,
// eftersom varje förfrågan kan köras i en ny funktion på Vercel.
export const MAX_WRITES = 60;
export const WINDOW_SECONDS = 60;

// Räknar anropet och säger om det får göras. Anropet skrivs in först, så att
// samtidiga anrop inte alla slinker under gränsen.
export async function registerWrite(ip: string, nowMs = Date.now()) {
  const now = Math.floor(nowMs / 1000);
  await run("DELETE FROM write_requests WHERE requested_at <= ?", [now - WINDOW_SECONDS]);
  await run("INSERT INTO write_requests (ip, requested_at) VALUES (?, ?)", [ip, now]);
  const row = await get<{ n: number }>("SELECT COUNT(*) AS n FROM write_requests WHERE ip = ? AND requested_at > ?", [
    ip,
    now - WINDOW_SECONDS,
  ]);
  return (row?.n ?? 0) <= MAX_WRITES;
}
