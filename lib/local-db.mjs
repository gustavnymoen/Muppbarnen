// Var den lokala databasen och dess säkerhetskopior ligger.
//
// Databasen ligger utanför projektmappen, i ~/Ai Projekt/muppbarnen-data/, så
// att den finns kvar om projektet klonas om eller mappen rensas.
//
// Säkerhetskopiorna ligger i projektets db/backups/ (inte i Git). Allt finns
// bara på den här datorn: koden säkras i Git, databasen kan byggas upp igen.
//
// Används av lib/db.ts och skripten i scripts/.
import os from "node:os";
import path from "node:path";

export const localDataDir = path.join(os.homedir(), "Ai Projekt", "muppbarnen-data");
export const localDbFile = path.join(localDataDir, "muppbarnen.db");
// Relativt projektmappen (npm-skripten och Next körs alltid därifrån)
export const backupDir = path.join(process.cwd(), "db", "backups");

// Testernas egen databas (npm run test:local). Byggs om från grunden vid
// varje testkörning, så testerna rör aldrig den riktiga lokala databasen.
export const testDbFile = path.join(localDataDir, "test.db");

// Enhetstesternas databas (npm run test:unit): byggs om från grunden
// av vitest.global-setup.mjs, skild från test.db så att båda kan köras samtidigt.
export const unitTestDbFile = path.join(localDataDir, "unit-test.db");

// Testernas bilder (npm run test:local): en egen mapp som raderas vid varje körning
export const testPicturesDir = path.join(localDataDir, "test-pictures");
