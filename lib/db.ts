import "server-only";
import { createClient, type InArgs, type ResultSet, type Transaction } from "@libsql/client";
import { localDbFile } from "./local-db.mjs";

// Lokalt: SQLite-filen ~/Ai Projekt/muppbarnen-data/muppbarnen.db (se lib/local-db.mjs). I produktion (Vercel): Turso, som
// pekas ut av TURSO_DATABASE_URL och TURSO_AUTH_TOKEN. Samma SQL fungerar i båda.
// På Vercel måste Turso användas, en fil där kan inte spara något
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL saknas på Vercel (Settings -> Environment Variables)");
}
const url = process.env.TURSO_DATABASE_URL ?? `file:${localDbFile}`;
export const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

if (url.startsWith("file:")) {
  // Lokal fil: kontrollera REFERENCES (Turso sköter sina inställningar själv)
  await db.execute("PRAGMA foreign_keys = ON");
}

// Både db och en pågående transaktion kan köra frågor
export type Executor = { execute: (stmt: { sql: string; args: InArgs }) => Promise<ResultSet> };

// Gör om svaret till vanliga objekt, { kolumn: värde }, som går att skicka till sidan
function toObjects<T>(result: ResultSet): T[] {
  return result.rows.map(
    (row) => Object.fromEntries(result.columns.map((col, i) => [col, row[i]])) as T,
  );
}

// Alla rader
export async function all<T>(sql: string, args: InArgs = [], ex: Executor = db): Promise<T[]> {
  return toObjects<T>(await ex.execute({ sql, args }));
}

// Första raden, eller undefined
export async function get<T>(sql: string, args: InArgs = [], ex: Executor = db) {
  return (await all<T>(sql, args, ex))[0] as T | undefined;
}

// För INSERT/UPDATE/DELETE: antal ändrade rader och id på ny rad
export async function run(sql: string, args: InArgs = [], ex: Executor = db) {
  const result = await ex.execute({ sql, args });
  return { changes: result.rowsAffected, lastId: Number(result.lastInsertRowid) };
}

// Kör allt i en transaktion: antingen sparas allt eller inget. "write" låser
// databasen för skrivning direkt, så två samtidiga ändringar inte krockar.
//
// Är databasen låst av en annan skrivning ("database is locked") väntar vi
// en kort stund och försöker igen. Det är säkert eftersom ett misslyckat
// försök rullas tillbaka helt.
export async function withTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await runTransaction(fn);
    } catch (e) {
      const busy = e instanceof Error && e.message.includes("SQLITE_BUSY");
      if (!busy || attempt >= 20) throw e;
      await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
    }
  }
}

async function runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const tx = await db.transaction("write");
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
}

// Vilken sorts databasfel det är, oavsett om det kom från filen eller Turso
export function constraintKind(e: unknown): "unique" | "foreignKey" | null {
  const message = e instanceof Error ? e.message : "";
  if (/UNIQUE constraint failed|PRIMARY KEY/.test(message)) return "unique";
  if (/FOREIGN KEY constraint failed/.test(message)) return "foreignKey";
  return null;
}

// % och _ betyder något speciellt i LIKE, så de måste "escapas".
// Används tillsammans med ESCAPE '\' i SQL-frågan.
export function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (c) => "\\" + c);
}
