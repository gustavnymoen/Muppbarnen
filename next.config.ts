import type { NextConfig } from "next";

// Utan lösenord och nyckel är sajten (MUPP-009) eller admin (MUPP-003) stängd för alla. På
// Vercel stoppas bygget hellre än att publicera en sajt som ingen kommer in på.
const required = ["SITE_PASSWORD", "SITE_SESSION_SECRET", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (process.env.VERCEL && missing.length > 0) {
  throw new Error(
    `${missing.join(", ")} saknas i bygget på Vercel. Lägg in dem under ` +
      "Settings -> Environment Variables (Production och Preview) och bygg om.",
  );
}

// Content-Security-Policy: allt hämtas från sajten själv, och inget kan skickas till
// en annan sajt. En policy med nonce går inte: den kräver att varje sida byggs vid
// varje förfrågan, och sajten använder Partial Prerendering (cacheComponents). Därför
// tillåts inline-skript och inline-stilar (Next.js och React lägger själva in sådana
// för start och strömning av sidor), men skript, anslutningar, ramar och formulär kan
// inte peka på andra sajter. Valet och varför: wiki/system/security.md.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Testservern (scripts/test-server.mjs) bygger i en egen mapp
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  // Bilden som laddas upp får vara 4 MB (lib/image-type.ts) plus formulärets egna byte
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Säkerhet: sidan får inte visas i en ram på en annan sida (clickjacking),
  // filtyper gissas inte, och adressen skickas inte vidare till andra sajter
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Admin ska inte indexeras (MUPP-003-R8); samma sak står i sidornas meta-taggar
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
