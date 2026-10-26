import { createClient, type InArgs } from "@libsql/client";
import { unitTestDbFile } from "../lib/local-db.mjs";

// Läser enhetstesternas databas, som vitest.global-setup.mjs bygger om före
// varje körning. Bara för enhetstester, aldrig för sajten.
export async function queryUnitDb<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const db = createClient({ url: `file:${unitTestDbFile}` });
  try {
    return (await db.execute({ sql, args })).rows as unknown as T[];
  } finally {
    db.close();
  }
}

// En egen anslutning, för tester som behöver en transaktion
export const openUnitDb = () => createClient({ url: `file:${unitTestDbFile}` });
