// Skickar ETT testmail till adressen du anger, för att kontrollera leveransen (TECH-020).
// Nyckeln läses bara ur miljön och skrivs aldrig ut. Använd:
//   RESEND_API_KEY=… node scripts/send-test-mail.mjs din@adress.se
// eller, med nyckeln i en fil som Git ignorerar: node --env-file=.env.local scripts/send-test-mail.mjs din@adress.se
// Skriptet skickar utanför sajten (ingen databas, inga mottagare) och bara när du kör det för hand.
// shortcut: avsändaren står även i lib/mail.ts, byt båda om den ändras.
const FROM = "Tomten <tomten@kusinportalen.com>";

const to = process.argv[2];
const key = process.env.RESEND_API_KEY;
if (!to || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(to)) {
  console.error("Ange en e-postadress: node scripts/send-test-mail.mjs din@adress.se");
  process.exit(1);
}
if (!key) {
  console.error("RESEND_API_KEY saknas i miljön. Inget skickades.");
  process.exit(1);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: FROM,
    to: [to],
    subject: "Testmail från Kusinportalen",
    text: "Det här är ett testmail för att kontrollera att mejl från Kusinportalen kommer fram.\n\nDetta mail går inte att svara på.",
  }),
  signal: AbortSignal.timeout(10_000),
});
console.log(res.ok ? `Skickat till ${to}.` : `Misslyckades (HTTP ${res.status}).`);
process.exit(res.ok ? 0 : 1);
