import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { CLEANUP_PATH, PUBLIC_FILES, proxy } from "./proxy";

// Utan kaka: bara ikonerna och manifestet går att hämta (MUPP-046-R4)
const ask = (path: string, method = "GET") => proxy(new NextRequest(`http://localhost${path}`, { method }));

describe("MUPP-046-R4 the public files", () => {
  test("MUPP-046-R4 the list is exactly the icons and the manifest", () => {
    expect(PUBLIC_FILES).toEqual(["/icon.svg", "/icon.png", "/apple-icon.png", "/manifest.webmanifest"]);
  });

  test.each(PUBLIC_FILES)("MUPP-046-R4 %s passes without the cookie on GET and HEAD", (path) => {
    for (const method of ["GET", "HEAD"]) {
      const response = ask(path, method);
      // NextResponse.next() har ingen status 307 eller 401 och ingen Location
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });

  test.each(PUBLIC_FILES)("MUPP-046-R4 %s is refused for other methods", (path) => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) expect(ask(path, method).status).toBe(401);
  });

  test("MUPP-046-R4 lookalikes and everything else still need the cookie", () => {
    for (const path of ["/icon.png/x", "/icons/icon.png", "/icon.png/", "/Icon.png", "/icon.svg.map", "/bilder/1", "/api/x", "/admin"]) {
      expect(ask(path).status, path).toBe(path.startsWith("/bilder") || path.startsWith("/api") ? 401 : 307);
    }
    expect(ask("/").status).toBe(307);
  });
});

describe("MUPP-044 the cleanup route is open to Vercel Cron", () => {
  test("MUPP-044 the cron path in vercel.json is the one the proxy lets through, on GET only", () => {
    expect(JSON.parse(readFileSync("vercel.json", "utf8")).crons.map((c: { path: string }) => c.path)).toEqual([CLEANUP_PATH]);
    expect(ask(CLEANUP_PATH).status).toBe(200);
    for (const method of ["POST", "PUT", "DELETE"]) expect(ask(CLEANUP_PATH, method).status).toBe(401);
    expect(ask(`${CLEANUP_PATH}/x`).status).toBe(401);
  });
});
