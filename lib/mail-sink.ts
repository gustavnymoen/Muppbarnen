import { appendFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { localDataDir } from "./local-db.mjs";

// Utkorgen för mejl som inte skickas på riktigt (TECH-017-R2): en rad JSON per mejl i en fil bredvid den lokala
// databasen. En fil och inte minnet, eftersom testservern och testerna är olika processer. Läses av testerna.
export type SentMail = { to: string; subject: string; text: string; html: string };

export const mailOutboxFile = path.join(localDataDir, "mail-outbox.jsonl");

export function saveToOutbox(mail: SentMail, file = mailOutboxFile) {
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(mail) + "\n");
}

export function readOutbox(file = mailOutboxFile): SentMail[] {
  try {
    return readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as SentMail);
  } catch {
    return [];
  }
}

export const clearOutbox = (file = mailOutboxFile) => rmSync(file, { force: true });
