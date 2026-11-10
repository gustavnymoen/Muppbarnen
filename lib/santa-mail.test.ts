import { describe, expect, test } from "vitest";
import { INSTALL_TIP, MAIL_FOOTER, SITE_URL, layout } from "./mail";
import { STATUS_CONFIRMATIONS, activatedMail, addedMail, deactivatedMail, listChangedMail, messageFromGiverMail, messageFromReceiverMail, startedMail, stoppedMail } from "./santa-mail";

const G = "Familjen Test";
const ADMIN = "Pelle Admin";
// En medlem, en önskan och en meddelandetext som aldrig får synas i något mejl
const SECRETS = ["Maja Medlem", "en röd cykel", "Hej, vad vill du ha?"];

// Varje rad är ett mejl i kortet: dess ämne och text (MUPP-052-R1)
const mails = [
  {
    n: 1,
    mail: activatedMail(G, ADMIN),
    subject: "Secret Santa: Familjen Test – Nu kan du skriva din önskelista",
    text:
      "Ho-Ho! Nu har gruppen Familjen Test öppnat. Gå in på sajten, välj Secret Santa och din grupp, logga in med ditt telefonnummer eller din e-post och skriv din önskelista. Senare dras lottningen, och du ser vem du ska handla åt.\n" +
      "Du kan inte matchas med din partner, dig själv eller den du hade förra året!\n" +
      "Du kan fylla i din önskelista från och med nu och ändra fram till julafton, men var snäll mot din matchning och bestäm dig i tid!\n" +
      "Allt är hemligt: ingen får veta vem som drar vem. Är det här inte du, eller vill du inte vara med, hör av dig till Pelle Admin.",
  },
  {
    n: 2,
    mail: deactivatedMail(G),
    subject: "Secret Santa: Familjen Test – är avaktiverad!",
    text: "Gruppen Familjen Test är avaktiverad. Det går inte att skriva önskelistor just nu. Du får ett nytt mail om den öppnas igen. Något kan ha gått fel i admin-joxandet!",
  },
  {
    n: 3,
    mail: startedMail(G),
    subject: "Secret Santa: Familjen Test – nu har du fått en secret santa!",
    text:
      "Ho ho ho! Dragningen i Familjen Test är gjord. Gå in och se vem du ska handla åt. Du kan fortfarande ändra din önskelista, och du kan skicka och ta emot frågor utan att någon får veta vem du är. I din önskelista kan du få frågor från din matchning om din önskelista. Du kan också meddela om det är något dom vill framföra!\n" +
      "I din secret santas önskelista kan du skicka frågor och få svar om hens lista!\n" +
      "Det är alltså två chattar, en i din lista om DIN önskelista, samt en i din matchnings lista!",
  },
  {
    n: 4,
    mail: stoppedMail(G),
    subject: "Secret Santa: Familjen Test – dragningen är stoppad",
    text: "Oh no! Dragningen i Familjen Test är stoppad, till exempel för att någon saknades. Din tilldelning och dina samtal är borttagna och en ny dragning görs. Din önskelista finns kvar. Du får ett nytt mail när den är klar.",
  },
  {
    n: 5,
    mail: listChangedMail(G),
    subject: "Secret Santa: Familjen Test – din matchning har uppdaterat sin önskelista",
    text: "Nu händer det grejer! Din matchning har uppdaterat sin önskelista.",
  },
  {
    n: 6,
    mail: messageFromGiverMail(G),
    subject: "Secret Santa: Familjen Test – nytt meddelande från din Secret Santa",
    text: "Ay caramba! Du har fått ett nytt meddelande från din Secret Santa (den som ska handla åt dig). Det kan vara en fråga om något i din lista, så in och kika!",
  },
  {
    n: 7,
    mail: messageFromReceiverMail(G),
    subject: "Secret Santa: Familjen Test – nytt meddelande från din matchning",
    text: "Whooop! Du har fått ett nytt meddelande från din matchning (den du ska köpa till). Det kan vara ett svar på en fråga du ställde, eller allmänt gnäll, in och kolla!",
  },
  {
    n: 8,
    mail: addedMail(G, ADMIN),
    subject: "Secret Santa: Familjen Test – välkommen",
    text: "Du har lagts till i Secret Santa-gruppen Familjen Test av Pelle Admin. Är det här inte du, eller vill du inte vara med, hör av dig till Pelle Admin. När gruppen öppnar får du ett nytt mail som berättar hur det går till!",
  },
];

// Mejlen som får tipset om hemskärmen (MUPP-058-R1)
const TIP_MAILS = [1, 3, 8];

describe("MUPP-052-R1 the mails", () => {
  test.each(mails)("MUPP-052-R1 mail $n has exactly the subject and text of the card", ({ n, mail, subject, text }) => {
    expect(mail).toEqual({ subject, text, ...(TIP_MAILS.includes(n) && { installTip: true }) });
  });

  test.each(mails)("MUPP-052-R1 mail $n names the event and ends with the shared layout", ({ n, mail }) => {
    const { html, plain } = layout(mail);
    expect(mail.subject.startsWith(`Secret Santa: ${G} – `)).toBe(true);
    // Mejlen med tipset (MUPP-058) har det efter raden, de andra slutar med raden
    if (!TIP_MAILS.includes(n)) expect(plain.endsWith(MAIL_FOOTER)).toBe(true);
    expect(html).toContain(MAIL_FOOTER);
  });

  test("MUPP-052-R1 no mail holds a member name, a wish or a message, and only mails 1 and 8 name the administrator", () => {
    // Funktionerna tar bara gruppens namn och administratörens; en annan uppgift kan inte komma in i texten
    for (const { n, mail } of mails) {
      const all = `${mail.subject}\n${mail.text}`;
      for (const secret of SECRETS) expect(all, `mail ${n}`).not.toContain(secret);
      expect(all.includes(ADMIN), `mail ${n}`).toBe(n === 1 || n === 8);
    }
  });
});

describe("MUPP-052-R2 the confirmations", () => {
  test("MUPP-052-R2 every status change asks 'Är du säker?' and says what happens", () => {
    for (const { title } of Object.values(STATUS_CONFIRMATIONS)) expect(title).toBe("Är du säker?");
    const { activate, deactivate, start, stop } = STATUS_CONFIRMATIONS;
    expect(activate.text).toMatch(/mail.*börja skriva önskelistor/);
    expect(deactivate.text).toMatch(/mail.*Önskelistorna finns kvar/);
    expect(start.text).toMatch(/person att handla åt.*mail.*inte.*lägga till eller ta bort.*kan rättas/);
    expect(stop.text).toMatch(/Dragningen och alla samtal tas bort.*önskelistorna finns kvar.*mail/);
  });
});

describe("MUPP-058-R1 the install tip", () => {
  const STEP_1 = "Öppna kusinportalen.com i Safari (iPhone) eller Chrome (Android).";

  test.each(mails.filter(({ n }) => TIP_MAILS.includes(n)))("MUPP-058-R1 mail $n has the tip after the button and the footer line, as a numbered list in HTML", ({ mail }) => {
    const { html, plain } = layout(mail);
    expect(html).toMatch(new RegExp(`${MAIL_FOOTER}</p><p>Tomtenissen tipsar: Vill du ha en bättre och smidigare upplevelse\\? Gör så här:</p><ol><li>${STEP_1.replace(/[()]/g, "\\$&")}</li><li>.*</li><li>.*</li></ol></div></body></html>$`));
    expect(html.indexOf(INSTALL_TIP.intro)).toBeGreaterThan(html.indexOf("Gå till Kusinportalen"));
    expect(plain).toContain(`${MAIL_FOOTER}\n\nTomtenissen tipsar: Vill du ha en bättre och smidigare upplevelse? Gör så här:\n1. ${STEP_1}\n2. I Safari på iPhone`);
    expect(plain).toMatch(/\n3\. Nu är Kusinportalen tillagd som en "app" på din startskärm.*notiser fungerar inte som en vanlig app\.$/);
  });

  test.each(mails.filter(({ n }) => !TIP_MAILS.includes(n)))("MUPP-058-R1 mail $n has no tip", ({ mail }) => {
    const { html, plain } = layout(mail);
    expect(html).not.toContain("Tomtenissen tipsar");
    expect(html).not.toContain("<ol>");
    expect(plain).not.toContain("Tomtenissen tipsar");
  });

  test("MUPP-058-R1 the tip is one text in one place: three steps, the first with the site address from SITE_URL", () => {
    expect(INSTALL_TIP.steps).toHaveLength(3);
    expect(INSTALL_TIP.steps[0]).toBe(STEP_1);
    expect(SITE_URL).toBe("https://www.kusinportalen.com");
  });
});
