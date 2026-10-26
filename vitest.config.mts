import path from "node:path";
import { defineConfig } from "vitest/config";

// Enhetstester: *.test.ts bredvid koden eller datan de testar.
// Webbläsartesterna i tests/ körs av Playwright, inte här.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // server-only stoppar import utanför servern; i enhetstesterna av
      // serverkoden (lib/*.test.ts) är det en tom modul
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", ".next-test/**", "tests/**"],
    environment: "node",
    // Bygger en färsk databas för datakontrollerna, aldrig din egen
    globalSetup: ["./vitest.global-setup.mjs"],
    // En fil i taget: flera tester kan skriva till samma databas, och två
    // skrivande transaktioner samtidigt ger "database is locked"
    fileParallelism: false,
  },
});
