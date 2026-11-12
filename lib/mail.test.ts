import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MAIL_FOOTER, SITE_URL, layout, sendMail } from "./mail";
import { clearOutbox, readOutbox } from "../tests/mail-outbox";

const mail = { subject: "Secret Santa: Familjen – hej", text: "Dragningen är gjord." };
const local = { TURSO_DATABASE_URL: "file:/tmp/x.db" };
const withKey = { ...local, RESEND_API_KEY: "re_test_key" };

beforeEach(() => clearOutbox());
afterEach(() => clearOutbox());

describe("TECH-017-R0 mail layout", () => {
  test("TECH-017-R0 has the logo with an alt text, the link and the footer line in both parts", () => {
    const { html, plain } = layout(mail);
    expect(html).toContain(`<img src="${SITE_URL}/icon.png"`);
    expect(html).toMatch(/alt="Kusinportalen"/);
    expect(html).toContain(`href="${SITE_URL}"`);
    expect(html).toContain(MAIL_FOOTER);
    expect(plain).toContain(SITE_URL);
    expect(plain.endsWith(MAIL_FOOTER)).toBe(true);
    expect(MAIL_FOOTER).toBe("Detta mail går inte att svara på.");
  });

  test("TECH-017-R0 HTML characters in the text are escaped in the HTML part", () => {
    const { html, plain } = layout({ subject: "x", text: 'a & "b" <script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("a &amp; &quot;b&quot; &lt;script&gt;");
    expect(plain).toContain('a & "b" <script>');
  });
});

describe("MUPP-052-R3 layout of every mail", () => {
  const { html, plain } = layout({ subject: "x", text: "Första raden\nandra raden\n\nNytt stycke" });

  test("MUPP-052-R3 a blank line starts a paragraph and a single line break stays a line break", () => {
    expect(html).toContain("<p>Första raden<br>andra raden</p><p>Nytt stycke</p>");
    expect(plain).toContain("Första raden\nandra raden\n\nNytt stycke");
  });

  test("MUPP-052-R3 a button to the site in the site's colours, and under it the line that the mail can not be answered", () => {
    expect(html).toMatch(/<a href="https:\/\/www\.kusinportalen\.com" style="[^"]*border-radius:14px;background:#9AA9E0;color:#0C1015;[^"]*">Gå till Kusinportalen<\/a>/);
    expect(html.indexOf(MAIL_FOOTER)).toBeGreaterThan(html.indexOf("Gå till Kusinportalen"));
  });

  test("MUPP-052-R3 the plain-text version has the same text, the address and the same line", () => {
    expect(plain).toBe(`Första raden\nandra raden\n\nNytt stycke\n\nGå till Kusinportalen: ${SITE_URL}\n${MAIL_FOOTER}`);
  });
});

describe("TECH-021 deliverability", () => {
  test("TECH-021-R1 the HTML is a complete document in Swedish with the subject as title", () => {
    const { html, plain } = layout({ subject: 'Hej & "välkommen"', text: "Hej" });
    expect(html).toMatch(/^<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Hej &amp; &quot;välkommen&quot;<\/title><\/head><body>/);
    expect(html).toMatch(/<\/body><\/html>$/);
    expect(plain).toBe(`Hej\n\nGå till Kusinportalen: ${SITE_URL}\n${MAIL_FOOTER}`);
  });

  test("TECH-021-R2 the first element of the body is a hidden preview of the first paragraph, cut at 90 characters and escaped", () => {
    const long = `${"a".repeat(80)} <b>${"c".repeat(40)}`;
    const { html } = layout({ subject: "x", text: `${long}\n\nAndra stycket` });
    const preview = html.match(/<body><div style="([^"]*)">([^<]*)<\/div>/);
    expect(preview?.[1]).toContain("display:none");
    expect(preview?.[2]).toBe(`${"a".repeat(80)} &lt;b&gt;${"c".repeat(6)}`);
    expect(preview?.[2]).not.toContain("Andra");
    expect(layout({ subject: "x", text: "Rad ett\nrad två\n\nNytt" }).html).toContain(">Rad ett rad två</div>");
  });
});

describe("TECH-017-R1 send a plain mail", () => {
  test("TECH-017-R1 one request goes to the provider with sender, recipient, subject, both parts and the key", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    expect(await sendMail("anna@example.com", mail, withKey, send)).toEqual({ ok: true });
    expect(send).toHaveBeenCalledOnce();
    const [url, init] = send.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ from: "Tomten <tomten@kusinportalen.com>", to: ["anna@example.com"], subject: mail.subject });
    expect(body.html).toContain(mail.text);
    expect(body.text).toContain(MAIL_FOOTER);
    expect(readOutbox()).toEqual([]);
  });

  test("TECH-017-R1 a provider error or a failed request is a failure, not an exception, and nothing is logged", async () => {
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn")];
    expect(await sendMail("anna@example.com", mail, withKey, vi.fn().mockResolvedValue({ ok: false, status: 500 }))).toEqual({ ok: false });
    expect(await sendMail("anna@example.com", mail, withKey, vi.fn().mockRejectedValue(new Error("anna@example.com re_test_key")))).toEqual({ ok: false });
    for (const log of logs) expect(log).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  test("TECH-017-R1 an address that is not an address sends nothing", async () => {
    const send = vi.fn();
    for (const bad of ["", "anna", "anna@", "a b@example.com", "anna@example.com\nBcc: x@y.se", "<a@b.se>"]) {
      expect(await sendMail(bad, mail, withKey, send), bad).toEqual({ ok: false });
    }
    expect(send).not.toHaveBeenCalled();
    expect(readOutbox()).toEqual([]);
  });
});

describe("TECH-017-R2 no mail outside production", () => {
  test("TECH-017-R2 with a local database and no key the mail goes to the outbox and nothing is fetched", async () => {
    const send = vi.fn();
    expect(await sendMail("anna@example.com", mail, local, send)).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
    expect(readOutbox()).toEqual([expect.objectContaining({ to: "anna@example.com", subject: mail.subject, text: mail.text })]);
  });

  test("TECH-017-R2 without a key and without a local database nothing is sent and the caller gets a failure", async () => {
    const send = vi.fn();
    expect(await sendMail("anna@example.com", mail, { TURSO_DATABASE_URL: "libsql://x.turso.io" }, send)).toEqual({ ok: false });
    expect(await sendMail("anna@example.com", mail, {}, send)).toEqual({ ok: false });
    expect(send).not.toHaveBeenCalled();
    expect(readOutbox()).toEqual([]);
  });
});
