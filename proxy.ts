import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE, siteSecrets, verifySession } from "@/lib/site-session";

// Hela sajten ligger bakom sajtlösenordet (MUPP-009). Utan giltig kaka släpps
// bara lösenordssidan igenom. Sidor skickas dit; API-rutter, serveråtgärder,
// bilder och allt som inte är en vanlig hämtning av en sida får 401 utan innehåll.
// Det som servern läser kontrollerar kakan en gång till (lib/site-auth.ts).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Alla metoder släpps hit, för inloggningens serveråtgärd: varje annan åtgärd kontrollerar kakan själv
  if (pathname === LOGIN_PATH) return NextResponse.next();

  if (verifySession(request.cookies.get(SESSION_COOKIE)?.value, siteSecrets()?.secret)) return NextResponse.next();

  const isPage = (request.method === "GET" || request.method === "HEAD") && !request.headers.has("next-action");
  if (!isPage || pathname.startsWith("/api/") || pathname.startsWith("/bilder/")) {
    return new NextResponse(null, { status: 401 });
  }
  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set("till", pathname + search);
  // Utan innehåll i svaret, bara adressen i Location
  return new NextResponse(null, { status: 307, headers: { location: login.toString() } });
}

export const config = {
  // Stilar, skript och typsnitt i _next/static behövs av lösenordssidan
  matcher: ["/((?!_next/static).*)"],
};
