// Körs en gång innan enhetstesterna: raderar och bygger om enhetstesternas egen
// databas (unit-test.db) från schema, seed och migreringar med samma skript som
// sajten, så att datakontrollerna läser exakt det migreringarna skapar.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { localDataDir, unitTestDbFile } from "./lib/local-db.mjs";

export default function setup() {
  mkdirSync(localDataDir, { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) rmSync(unitTestDbFile + suffix, { force: true });
  const result = spawnSync("node", ["scripts/db-setup.mjs"], {
    env: { ...process.env, TURSO_DATABASE_URL: `file:${unitTestDbFile}`, TURSO_AUTH_TOKEN: "" },
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`Testdatabasen kunde inte byggas:\n${result.stderr}`);
}
