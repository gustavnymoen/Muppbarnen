import type { NextConfig } from "next";

// Utan sajtlösenord och nyckel är sajten stängd för alla. På Vercel stoppas
// bygget hellre än att publicera en sajt som ingen kommer in på (MUPP-009).
if (process.env.VERCEL && !(process.env.SITE_PASSWORD && process.env.SITE_SESSION_SECRET)) {
  throw new Error(
    "SITE_PASSWORD eller SITE_SESSION_SECRET saknas i bygget på Vercel. Lägg in båda under " +
      "Settings -> Environment Variables (Production och Preview) och bygg om.",
  );
}

const nextConfig: NextConfig = {
  // Testservern (scripts/test-server.mjs) bygger i en egen mapp
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  // Säkerhet: sidan får inte visas i en ram på en annan sida (clickjacking),
  // filtyper gissas inte, och adressen skickas inte vidare till andra sajter
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
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
