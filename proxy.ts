import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_PATH, adminSecrets, verifyAdminSession } from "@/lib/admin-session";
import { LOGIN_PATH, SESSION_COOKIE, siteSecrets, verifySession } from "@/lib/site-session";

// Hela sajten ligger bakom sajtlösenordet (MUPP-009). Utan giltig kaka släpps
// bara lösenordssidan igenom. Sidor skickas dit; API-rutter, serveråtgärder,
// bilder och allt som inte är en vanlig hämtning av en sida får 401 utan innehåll.
// Det som servern läser kontrollerar kakan en gång till (lib/site-auth.ts).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Alla metoder släpps hit, för inloggningens serveråtgärd: varje annan åtgärd kontrollerar kakan själv
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const isPage = (request.method === "GET" || request.method === "HEAD") && !request.headers.has("next-action");
  if (verifySession(request.cookies.get(SESSION_COOKIE)?.value, siteSecrets()?.secret)) return adminGate(request, isPage);

  if (!isPage || pathname.startsWith("/api/") || pathname.startsWith("/bilder/")) {
    return new NextResponse(null, { status: 401 });
  }
  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set("till", pathname + search);
  // Utan innehåll i svaret, bara adressen i Location
  return new NextResponse(null, { status: 307, headers: { location: login.toString() } });
}

// Admin (MUPP-003): under /admin kommer bara den med adminkaka in. /admin själv släpps igenom,
// eftersom det är inloggningssidan och dess inloggningsåtgärd; där och i varje åtgärd
// kontrollerar koden adminkakan igen (lib/admin-auth.ts).
function adminGate(request: NextRequest, isPage: boolean) {
  const { pathname } = request.nextUrl;
  const inAdmin = pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
  if (!inAdmin || pathname === ADMIN_PATH) return NextResponse.next();
  if (verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, adminSecrets()?.secret)) return NextResponse.next();
  if (!isPage) return new NextResponse(null, { status: 401 });
  return new NextResponse(null, { status: 307, headers: { location: new URL(ADMIN_PATH, request.url).toString() } });
}

export const config = {
  // Stilar, skript och typsnitt i _next/static behövs av lösenordssidan
  matcher: ["/((?!_next/static).*)"],
};
