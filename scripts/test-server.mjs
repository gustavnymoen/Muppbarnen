// Startar sajten för npm run test:local. Playwright kör det här skriptet
// (se playwright.config.ts) och väntar tills sajten svarar.
//
// - Databasen är en egen testdatabas, ~/Ai Projekt/muppbarnen-data/test.db, som raderas
//   och byggs om från schema, seed och migreringar varje gång. Testerna
//   börjar alltså alltid från samma läge och rör aldrig din vanliga databas.
// - Sajten byggs och körs som i produktion (next build + next start), men i
//   mappen .next-test så att en dev-server som redan är igång inte störs.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { localDataDir, testDbFile } from "../lib/local-db.mjs";

const PORT = process.env.PORT ?? "3100";

mkdirSync(localDataDir, { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) rmSync(testDbFile + suffix, { force: true });

const env = {
  ...process.env,
  TURSO_DATABASE_URL: `file:${testDbFile}`,
  TURSO_AUTH_TOKEN: "",
  NEXT_DIST_DIR: ".next-test",
};

// prebuild (scripts/db-setup.mjs) skapar testdatabasen
const build = spawnSync("npm", ["run", "build"], { env, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn("npx", ["next", "start", "-p", PORT], { env, stdio: "inherit" });
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
