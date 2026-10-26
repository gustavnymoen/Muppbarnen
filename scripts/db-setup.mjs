// Skapar och uppdaterar databasen.
//
//   node scripts/db-setup.mjs           skapar databasen om den saknas och kör nya migreringar
//   node scripts/db-setup.mjs --backup  dessutom en säkerhetskopia (körs av npm run dev)
//   node scripts/db-setup.mjs --reset   (bara lokalt) sparar en kopia, raderar och bygger om
//
// Utan miljövariabler används den lokala filen ~/Ai Projekt/muppbarnen-data/muppbarnen.db.
// Säkerhetskopiorna hamnar i db/backups/. Se lib/local-db.mjs. Är
// TURSO_DATABASE_URL och TURSO_AUTH_TOKEN satta används Turso i stället
// (det sker på Vercel vid varje bygge, och med npm run db:turso).
//
// En ny databas byggs från db/schema.sql och db/seed.sql. Därefter körs
// filerna i db/migrations/ i nummerordning. Varje migrering körs bara en
// gång per databas (det noteras i tabellen schema_migrations), så befintlig
// data ligger kvar när nya tabeller eller rader läggs till.

import { createClient } from "@libsql/client";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { backupDir, localDbFile } from "../lib/local-db.mjs";

const dbDir = path.join(import.meta.dirname, "..", "db");
const migrationsDir = path.join(dbDir, "migrations");
const reset = process.argv.includes("--reset");
const backupNow = process.argv.includes("--backup");
// Så många säkerhetskopior sparas, de äldsta tas bort
const KEEP_BACKUPS = 20;

// En "file:"-adress räknas som lokal (används t.ex. för att testa mot en kopia)
const envUrl = process.env.TURSO_DATABASE_URL;
const remoteUrl = envUrl && !envUrl.startsWith("file:") ? envUrl : undefined;

// På Vercel (VERCEL=1) måste Turso användas. Utan det skulle sajten tyst köra
// mot en fil som skapas vid bygget och inte kan spara något. Ett stoppat
// bygge ersätter inte den publicerade versionen, så sajten ligger kvar.
if (process.env.VERCEL && !remoteUrl) {
  console.error(
    "TURSO_DATABASE_URL saknas i bygget på Vercel. Kontrollera Settings -> Environment " +
      "Variables (namn och miljön Production) och bygg om.",
  );
  process.exit(1);
}
// Den lokala fil som används (vanligtvis ~/Ai Projekt/muppbarnen-data/muppbarnen.db)
const localFile = envUrl?.startsWith("file:") ? envUrl.slice("file:".length) : localDbFile;
const where = remoteUrl ? `Turso (${remoteUrl})` : localFile;

const open = () =>
  createClient({ url: remoteUrl ?? `file:${localFile}`, authToken: process.env.TURSO_AUTH_TOKEN });

// Säkerhetskopia av den lokala filen, t.ex. db/backups/muppbarnen-2026-10-19T18-40-00.db.
// Vill du återställa: stoppa servern och kopiera filen till ~/Ai Projekt/muppbarnen-data/muppbarnen.db.
// (Turso har egen historik och kan återställas i deras webbgränssnitt.)
async function backup(db) {
  // Bara den vanliga lokala databasen, inte Turso eller testdatabasen
  if (remoteUrl || localFile !== localDbFile) return;
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toLocaleString("sv-SE").replace(" ", "T").replace(/:/g, "-");
  const backupFile = path.join(backupDir, `muppbarnen-${stamp}.db`);
  // Skriv först till en tillfällig fil och byt namn när den är klar, så att
  // det aldrig finns en halvfärdig kopia under det riktiga namnet
  rmSync(`${backupFile}.tmp`, { force: true });
  await db.execute({ sql: "VACUUM INTO ?", args: [`${backupFile}.tmp`] });
  renameSync(`${backupFile}.tmp`, backupFile);
  console.log(`Säkerhetskopia: ${path.relative(process.cwd(), backupFile)}`);

  const old = readdirSync(backupDir)
    .filter((f) => /^muppbarnen-.*\.db$/.test(f))
    .sort()
    .slice(0, -KEEP_BACKUPS);
  for (const f of old) rmSync(path.join(backupDir, f));
}

// Säkerhetskopia när dev-servern startar (finns databasen inte än finns inget att kopiera)
if (backupNow && !reset && existsSync(localFile)) {
  const db = open();
  await backup(db);
  db.close();
}

if (reset) {
  if (remoteUrl) {
    console.error("--reset är avstängt mot Turso, så att riktig data inte raderas av misstag.");
    process.exit(1);
  }
  if (existsSync(localFile)) {
    const old = open();
    await backup(old);
    old.close();
    // Ta även bort WAL-filerna som SQLite skapar bredvid databasen
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(localFile + suffix, { force: true });
    }
  }
}

// Mappen för en ny lokal databas
if (!remoteUrl) mkdirSync(path.dirname(localFile), { recursive: true });
const db = open();
if (!remoteUrl) await db.execute("PRAGMA foreign_keys = ON");

// Ny databas = tabellen schema_migrations finns inte än (den skapas nedan,
// efter schema och seed, i varje databas som skriptet har byggt)
const isNew =
  (await db.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"))
    .rows.length === 0;

if (isNew) {
  if (!remoteUrl) await db.execute("PRAGMA journal_mode = WAL");
  await db.executeMultiple(readFileSync(path.join(dbDir, "schema.sql"), "utf8"));
  await db.executeMultiple(readFileSync(path.join(dbDir, "seed.sql"), "utf8"));
}

// ---- Migreringar
await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
  name       TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const applied = new Set(
  (await db.execute("SELECT name FROM schema_migrations")).rows.map((r) => r.name),
);
const pending = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && !applied.has(f))
  .sort();

// Kopia av befintlig data innan den ändras
if (pending.length > 0 && !isNew) await backup(db);

for (const file of pending) {
  // Hela migreringen eller inget: går något fel ändras ingenting
  const tx = await db.transaction("write");
  try {
    await tx.executeMultiple(readFileSync(path.join(migrationsDir, file), "utf8"));
    await tx.execute({ sql: "INSERT INTO schema_migrations (name) VALUES (?)", args: [file] });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
  console.log(`Migrering körd: ${file}`);
}

console.log(
  `Databas ${isNew ? "skapad" : pending.length > 0 ? "uppdaterad" : "oförändrad"}: ` +
    `${where.replace(/^(Turso \(libsql:\/\/[^.]+).*$/, "$1…)")}`,
);
db.close();
