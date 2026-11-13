import type { Mail } from "./mail";

// Alla mejl som Secret Santa skickar, med mottagare, tid och text på ett ställe (MUPP-052). Korten som skickar dem
// (MUPP-051, 041, 042, 043) anropar bara funktionerna här, och testerna läser samma texter. Ingen text får innehålla
// ett medlemsnamn, en önskan eller ett meddelande; bara mejl 1 och 8 nämner en person: gruppens administratör. Mejl 1, 3 och 8 får också tipset om hemskärmen (installTip, MUPP-058).
const subject = (group: string, what: string) => `Secret Santa: ${group} – ${what}`;
const contact = (admin: string) => `Är det här inte du, eller vill du inte vara med, hör av dig till ${admin}.`;

// Mejl 1: gruppen aktiveras (till alla medlemmar), och till en medlem som läggs till medan gruppen förbereds, direkt efter mejl 8
export const activatedMail = (group: string, admin: string): Mail => ({
  subject: subject(group, "Nu kan du skriva din önskelista"),
  text:
    `Ho-Ho! Nu har gruppen ${group} öppnat. Gå in på sajten, välj Secret Santa och din grupp, logga in med ditt telefonnummer eller din e-post och skriv din önskelista. Senare dras lottningen, och du ser vem du ska handla åt.\n` +
    `Du kan inte matchas med din partner, dig själv eller den du hade förra året!\n` +
    `Du kan fylla i din önskelista från och med nu och ändra fram till julafton, men var snäll mot din matchning och bestäm dig i tid!\n` +
    `Allt är hemligt: ingen får veta vem som drar vem. ${contact(admin)}`,
  installTip: true,
});

// Mejl 2: gruppen avaktiveras (till alla)
export const deactivatedMail = (group: string): Mail => ({
  subject: subject(group, "är avaktiverad!"),
  text: `Gruppen ${group} är avaktiverad. Det går inte att skriva önskelistor just nu. Du får ett nytt mail om den öppnas igen. Något kan ha gått fel i admin-joxandet!`,
});

// Mejl 3: dragningen är gjord och gruppen startad (till alla)
export const startedMail = (group: string): Mail => ({
  subject: subject(group, "nu har du fått en secret santa!"),
  text:
    `Ho ho ho! Dragningen i ${group} är gjord. Gå in och se vem du ska handla åt. Du kan fortfarande ändra din önskelista, och du kan skicka och ta emot frågor utan att någon får veta vem du är. I din önskelista kan du få frågor från din matchning om din önskelista. Du kan också meddela om det är något dom vill framföra!\n` +
    `I din secret santas önskelista kan du skicka frågor och få svar om hens lista!\n` +
    `Det är alltså två chattar, en i din lista om DIN önskelista, samt en i din matchnings lista!`,
  installTip: true,
});

// Mejl 4: gruppen stoppas (till alla)
export const stoppedMail = (group: string): Mail => ({
  subject: subject(group, "dragningen är stoppad"),
  text: `Oh no! Dragningen i ${group} är stoppad, till exempel för att någon saknades. Din tilldelning och dina samtal är borttagna och en ny dragning görs. Din önskelista finns kvar. Du får ett nytt mail när den är klar.`,
});

// Mejl 5: mottagarens lista ändrades (till givaren, samlat till ett mejl i timmen; en ändring eller tio ger samma mejl)
export const listChangedMail = (group: string): Mail => ({
  subject: subject(group, "din matchning har uppdaterat sin önskelista"),
  text: "Nu händer det grejer! Din matchning har uppdaterat sin önskelista.",
});

// Mejl 6: ett meddelande från givaren (till mottagaren, samlat över tio minuter per samtal)
export const messageFromGiverMail = (group: string): Mail => ({
  subject: subject(group, "nytt meddelande från din Secret Santa"),
  text: "Ay caramba! Du har fått ett nytt meddelande från din Secret Santa (den som ska handla åt dig). Det kan vara en fråga om något i din lista, så in och kika!",
});

// Mejl 7: ett meddelande från mottagaren (till givaren, samma gräns)
export const messageFromReceiverMail = (group: string): Mail => ({
  subject: subject(group, "nytt meddelande från din matchning"),
  text: "Whooop! Du har fått ett nytt meddelande från din matchning (den du ska köpa till). Det kan vara ett svar på en fråga du ställde, eller allmänt gnäll, in och kolla!",
});

// Mejl 8: en person läggs till i en grupp (till personen), i alla lägen där det går
export const addedMail = (group: string, admin: string): Mail => ({
  subject: subject(group, "välkommen"),
  text: `Du har lagts till i Secret Santa-gruppen ${group} av ${admin}. ${contact(admin)} När gruppen öppnar får du ett nytt mail som berättar hur det går till!`,
  installTip: true,
});

// Mejl 9: givaren tjatar om en önskelista (till mottagaren, MUPP-071). Säger bara gruppen, aldrig vem som tjatar.
export const nagListMail = (group: string): Mail => ({
  subject: subject(group, "Din secret santa vill ha in en lista!"),
  text: "Rappa på! Din secret santa vill att du skickar in en önskelista, personen är het på gröten! Ho ho ho!",
});

// Frågan i dialogen för varje statusändring (MUPP-052-R2); MUPP-051 och MUPP-041 sätter in dem i sina knappar
export const STATUS_CONFIRMATIONS = {
  activate: { title: "Är du säker?", text: "Alla i gruppen får ett mail och kan börja skriva önskelistor." },
  deactivate: { title: "Är du säker?", text: "Alla i gruppen får ett mail. Önskelistorna finns kvar." },
  start: {
    title: "Är du säker?",
    text: "Alla får en person att handla åt och ett mail. Efter det går det inte att lägga till eller ta bort någon, men namn, telefon och e-post kan rättas.",
  },
  stop: { title: "Är du säker?", text: "Dragningen och alla samtal tas bort, men önskelistorna finns kvar. Alla får ett mail." },
} as const;
