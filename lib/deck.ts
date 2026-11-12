import { childColor, type ChildColor } from "./child-colors";
import type { Occasion } from "./form-input";
import { pictureUrl } from "./picture-url";
import { sortWishes } from "./wishes";

// Kortleken på startsidan (MUPP-004): vilka kort som finns, i vilken ordning och vad som
// får skickas till webbläsaren. Rent data in och ut, så att det går att testa utan databas.

// Storlekarna som föräldrarna skrivit in (MUPP-010); tom text där ingen storlek finns
export type Sizes = { clothes: string; shoes: string; head: string; gloves: string };
export type DeckInput = { id: number; parentId: number; name: string; birthdate: string; picture: string; sizes: Sizes };
// claimedBy och claimedAt (ÅÅÅÅ-MM-DD) finns när någon har paxat önskningen (MUPP-005)
export type Wish = {
  id: number;
  title: string;
  description: string;
  size: string;
  url: string;
  unlimited: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
};
export type Wishes = Map<number, { birthday: Wish[]; christmas: Wish[] }>;
export type Today = { year: number; month: number; day: number };

// Det som webbläsaren får: kortets dag och månad och varje barns ålder, aldrig födelsedatumet eller födelseåret (specs/rules.md).
// expected: barnet är inte fött än (MUPP-011), då finns ingen ålder; ålder 0 är födseln (MUPP-031-R6). sizes: storlekarna visas för alla besökare (MUPP-014).
export type DeckKid = { id: number; name: string; age: number | null; expected: boolean; color: ChildColor; picture: string | undefined; sizes: Sizes; wishes: Wish[] };
// after: kortet gäller ett tillfälle som var för 1–30 dagar sedan (MUPP-031)
export type DeckCard = { key: string; kind: Occasion; day: number | null; month: number | null; next: boolean; after: boolean; kids: DeckKid[] };

const MONTHS = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];

// "17 mars"
export const dayAndMonth = (day: number, month: number) => `${day} ${MONTHS[month - 1].toLowerCase()}`;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / 86_400_000;

// Dagens datum i Sverige, oavsett var servern står
export function swedishToday(now = new Date()): Today {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

// Datumet som text, ÅÅÅÅ-MM-DD, som i databasen
export const isoDate = (today: Today) => `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;

// Månadens dag ett visst år. Den 29 februari firas den 28:e de år som inte har någon 29:e.
function occurrenceIn(year: number, month: number, day: number, today: Today) {
  const date = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return { year, month, day: date, days: dayNumber(year, month, date) - dayNumber(today.year, today.month, today.day) };
}

// Nästa gång månaden och dagen kommer, räknat från idag (idag räknas)
export function nextOccurrence(month: number, day: number, today: Today) {
  const thisYear = occurrenceIn(today.year, month, day, today);
  return thisYear.days < 0 ? occurrenceIn(today.year + 1, month, day, today) : thisYear;
}

// Hur många dagar ett kort och dess lista ligger kvar efter tillfället (MUPP-031)
export const DAYS_AFTER = 30;

// Tillfället som ett datum hör till (MUPP-031): det som var för 1–30 dagar sedan, annars nästa (dagen själv räknas).
// Inget tillfälle före firstYear räknas: ett barns första tillfälle är födseln.
function occasionOn(month: number, day: number, date: Today, firstYear = 0) {
  const thisYear = occurrenceIn(date.year, month, day, date);
  const last = thisYear.days <= 0 ? thisYear : occurrenceIn(date.year - 1, month, day, date);
  const occasion = last.days < 0 && last.days >= -DAYS_AFTER ? last : nextOccurrence(month, day, date);
  return occasion.year < firstYear ? occurrenceIn(firstYear, month, day, date) : occasion;
}

// Ett barns födelsedag eller julafton som datumet hör till. Födseln är det första tillfället: från födelsedatumet
// och 30 dagar till står det "Född", hur och när barnet än lades in (MUPP-031-R6, ändrar MUPP-011-R3).
export function occasionOf(kid: Pick<DeckInput, "birthdate">, kind: Occasion, date: Today) {
  if (kind === "christmas") return occasionOn(12, 24, date);
  const born = parseDate(kid.birthdate);
  return occasionOn(born.month, born.day, date, born.year);
}

// En önskning är arkiverad när tillfället den lades till inför har passerat och månaden efter är slut (MUPP-031-R4)
export const isArchived = (kid: Pick<DeckInput, "birthdate">, kind: Occasion, addedAt: string, today: Today) =>
  isoDate(occasionOf(kid, kind, parseDate(addedAt))) < isoDate(occasionOf(kid, kind, today));

// Barnet är inte fött än (MUPP-011): födelsedatumet ligger efter idag
export function isExpected(birthdate: string, today = swedishToday()) {
  return birthdate > isoDate(today);
}

// "2026-03-05" som år, månad och dag
export const parseDate = (date: string): Today => {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
};

// Samma förälders barn tillsammans, äldst först; grupperna ordnas efter sitt äldsta barn
function orderKids<T extends { parentId: number; birthdate: string; id: number }>(kids: T[]) {
  const byAge = (a: T, b: T) => a.birthdate.localeCompare(b.birthdate) || a.id - b.id;
  const groups = new Map<number, T[]>();
  for (const kid of [...kids].sort(byAge)) groups.set(kid.parentId, [...(groups.get(kid.parentId) ?? []), kid]);
  return [...groups.values()].sort((a, b) => byAge(a[0], b[0]) || a[0].parentId - b[0].parentId).flat();
}

export function buildDeck(children: DeckInput[], wishes: Wishes, today: Today): DeckCard[] {
  const wishesOf = (id: number, occasion: Occasion) => sortWishes(wishes.get(id)?.[occasion] ?? []);
  const toKid = (kid: DeckInput, age: number | null, occasion: Occasion, expected = false): DeckKid => ({
    id: kid.id,
    name: kid.name,
    age,
    expected,
    color: childColor(kid.id),
    picture: pictureUrl(kid.id, kid.picture),
    sizes: { clothes: kid.sizes.clothes.trim(), shoes: kid.sizes.shoes.trim(), head: kid.sizes.head.trim(), gloves: kid.sizes.gloves.trim() },
    wishes: wishesOf(kid.id, occasion),
  });

  // Ett födelsedagskort per datum: barnets födelsedag som idag hör till, den som var nyss eller nästa (MUPP-031-R1)
  const byDate = new Map<string, { days: number; day: number; month: number; kids: (DeckInput & { age: number | null })[] }>();
  for (const kid of children) {
    const occasion = occasionOf(kid, "birthday", today);
    const key = isoDate(occasion);
    const entry = byDate.get(key) ?? { days: occasion.days, day: occasion.day, month: occasion.month, kids: [] };
    entry.kids.push({ ...kid, age: isExpected(kid.birthdate, today) ? null : occasion.year - parseDate(kid.birthdate).year });
    byDate.set(key, entry);
  }

  const christmas = occasionOn(12, 24, today);
  const entries = [
    ...[...byDate.values()].map((entry) => ({ rank: 0, days: entry.days, card: { key: "", kind: "birthday" as const, day: entry.day, month: entry.month, next: false, after: entry.days < 0, kids: orderKids(entry.kids).map((k) => toKid(k, k.age, "birthday", k.age === null)) } })),
    ...(children.length > 0
      ? [{ rank: 1, days: christmas.days, card: { key: "", kind: "christmas" as const, day: null, month: null, next: false, after: christmas.days < 0, kids: orderKids(children).map((k) => toKid(k, null, "christmas")) } }]
      : []),
  ];
  // I datumordning: korten i månaden efter först, det senaste närmast det kommande (MUPP-031-R3); en födelsedag på julafton kommer före julkortet.
  // Nyckeln är kortets plats i leken, inte datumet. Leken öppnar på det första kommande kortet (next).
  const cards = entries.sort((a, b) => a.days - b.days || a.rank - b.rank).map((e, i) => ({ ...e.card, key: `kort-${i}` }));
  const next = cards.find((card) => !card.after);
  if (next) next.next = true;
  return cards;
}
