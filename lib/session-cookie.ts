import "server-only";
import { cookies } from "next/headers";

// Alla sessionskakor (sajten, admin, Secret Santa) sätts med samma regler: bara för servern, bara över https i produktion och
// inte med till andra sajter. maxAge utelämnas för en sessionskaka som försvinner när webbläsaren stängs; 0 tar bort kakan
// (en __Host-kaka utan Secure godtas inte ens för att tömmas, så samma regler gäller då).
export async function setSessionCookie(name: string, value: string, maxAge?: number) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  });
}
