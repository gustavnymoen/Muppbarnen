import "server-only";
import { SITE_NAME } from "@/app/components/SiteHeader";
import { saveToOutbox } from "./mail-sink";

// Skickar ett kort mejl i sajtens layout (TECH-017). Texterna och när de skickas bestämmer korten (MUPP-052 m.fl.);
// här finns bara layouten, leverantören (Resend, genom fetch) och utkorgen för tester.
export const SITE_URL = "https://www.kusinportalen.com";
export const MAIL_FOOTER = "Detta mail går inte att svara på.";
const FROM = "Tomten <tomten@kusinportalen.com>";
const API = "https://api.resend.com/emails";

export type Mail = { subject: string; text: string };
export type MailResult = { ok: true } | { ok: false };

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// En enkel kontroll: det mesta fångar leverantören, men en rad med radbrytning får aldrig bli en rubrik i mejlet
const VALID_ADDRESS = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Layouten (MUPP-052-R3): loggan (alt-texten syns när bilder blockeras; /icon.png är en av de få publika filerna), texten i stycken,
// en knapp till sajten i knapparnas stil (färgerna ur DESIGN.md; Fredoka finns inte i mejl, så en rund systemfont) och under den raden om att
// mejlet inte går att svara på. Ett tomt radbyte i texten börjar ett nytt stycke, ett enkelt radbyte blir en radbrytning.
const BUTTON_LABEL = `Gå till ${SITE_NAME}`;
const BUTTON_STYLE =
  "display:inline-block;padding:12px 20px;border-radius:14px;background:#9AA9E0;color:#0C1015;font-family:ui-rounded,'Arial Rounded MT Bold',system-ui,sans-serif;font-weight:500;text-decoration:none";

export function layout({ text }: Pick<Mail, "text">) {
  const plain = `${text}\n\n${BUTTON_LABEL}: ${SITE_URL}\n${MAIL_FOOTER}`;
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html =
    `<div style="font-family:sans-serif;max-width:480px;color:#222">` +
    `<img src="${SITE_URL}/icon.png" width="40" height="40" alt="${SITE_NAME}">` +
    paragraphs +
    `<p><a href="${SITE_URL}" style="${BUTTON_STYLE}">${BUTTON_LABEL}</a></p>` +
    `<p style="font-size:13px;color:#666">${MAIL_FOOTER}</p>` +
    `</div>`;
  return { html, plain };
}

export async function sendMail(to: string, mail: Mail, env: Record<string, string | undefined> = process.env, send: typeof fetch = fetch): Promise<MailResult> {
  if (!VALID_ADDRESS.test(to)) return { ok: false };
  const { html, plain } = layout(mail);
  const key = env.RESEND_API_KEY;
  if (!key) {
    // Utan nyckel skickas inget. Bara med en lokal databas (utveckling och tester) hamnar mejlet i utkorgen;
    // en driftsatt sajt utan nyckel misslyckas i stället för att låtsas (TECH-017-R2).
    if (!env.TURSO_DATABASE_URL?.startsWith("file:")) return { ok: false };
    try {
      saveToOutbox({ to, subject: mail.subject, text: mail.text, html });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
  try {
    const res = await send(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject: mail.subject, html, text: plain }),
      // En leverantör som inte svarar får inte hålla serveråtgärden öppen
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok };
  } catch {
    // Inget loggas: varken adress, nyckel eller text ska hamna i loggen
    return { ok: false };
  }
}
