import { readFileSync, rmSync } from "node:fs";
import { mailOutboxFile, type SentMail } from "../lib/mail-sink";

// Utkorgen som testerna läser (TECH-017-R2). Ligger här och inte i lib/mail-sink.ts: en läsning från en sökväg som först
// är känd vid körning får bygget att spåra hela projektet in i funktionerna som skickar mejl (TECH-022).

export function readOutbox(file = mailOutboxFile): SentMail[] {
  try {
    return readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as SentMail);
  } catch {
    return [];
  }
}

export const clearOutbox = (file = mailOutboxFile) => rmSync(file, { force: true });
