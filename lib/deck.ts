import { childColor, type ChildColor } from "./child-colors";
import { sortWishes } from "./wishes";

// Kortleken på startsidan (MUPP-004): vilka kort som finns, i vilken ordning och vad som
// får skickas till webbläsaren. Rent data in och ut, så att det går att testa utan databas.

// Storlekarna som föräldrarna skrivit in (MUPP-010); tom text där ingen storlek finns
export type Sizes = { clothes: string; shoes: string; head: string; gloves: string };
export type DeckInput = { id: number; parentId: number; name: string; birthdate: string; hasPicture: boolean; sizes: Sizes };
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

// Det som webbläsaren får: månad och ålder, aldrig dagen eller födelsedatumet (R6).
// expected: barnet är inte fött än (MUPP-011), då finns ingen ålder. sizes: storlekarna visas för alla besökare (MUPP-014).
export type DeckKid = { id: number; name: string; age: number | null; expected: boolean; color: ChildColor; hasPicture: boolean; sizes: Sizes; wishes: Wish[] };
export type DeckCard = { key: string; kind: "birthday" | "christmas"; month: number | null; next: boolean; kids: DeckKid[] };

export const MONTHS = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / 86_400_000;

// Dagens datum i Sverige, oavsett var servern står
export function swedishToday(now = new Date()): Today {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

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

// Barnet är inte fött än (MUPP-011): födelsedatumet ligger efter idag
export function isExpected(birthdate: string, today = swedishToday()) {
  return birthdate > `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;
}

const parseBirthdate = (birthdate: string) => {
  const [year, month, day] = birthdate.split("-").map(Number);
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
  const wishesOf = (id: number, occasion: "birthday" | "christmas") => sortWishes(wishes.get(id)?.[occasion] ?? []);
  const toKid = (kid: DeckInput, age: number | null, occasion: "birthday" | "christmas", expected = false): DeckKid => ({
    id: kid.id,
    name: kid.name,
    age,
    expected,
    color: childColor(kid.id),
    hasPicture: kid.hasPicture,
    sizes: { clothes: kid.sizes.clothes.trim(), shoes: kid.sizes.shoes.trim(), head: kid.sizes.head.trim(), gloves: kid.sizes.gloves.trim() },
    wishes: wishesOf(kid.id, occasion),
  });

  // En födelsedagskort per datum
  const byDate = new Map<string, { days: number; month: number; kids: (DeckInput & { age: number | null })[] }>();
  for (const kid of children) {
    const born = parseBirthdate(kid.birthdate);
    const expected = isExpected(kid.birthdate, today);
    let next = nextOccurrence(born.month, born.day, today);
    // Ett barn som är fött har aldrig ålder 0: nästa födelsedag är den första (MUPP-011-R3)
    if (!expected && next.year === born.year) next = occurrenceIn(born.year + 1, born.month, born.day, today);
    const key = `${next.month}-${next.day}`;
    const entry = byDate.get(key) ?? { days: next.days, month: next.month, kids: [] };
    entry.kids.push({ ...kid, age: expected ? null : next.year - born.year });
    byDate.set(key, entry);
  }

  const christmas = nextOccurrence(12, 24, today);
  const entries = [
    ...[...byDate.values()].map((entry) => ({ rank: 0, days: entry.days, card: { key: "", kind: "birthday" as const, month: entry.month, next: false, kids: orderKids(entry.kids).map((k) => toKid(k, k.age, "birthday", k.age === null)) } })),
    ...(children.length > 0
      ? [{ rank: 1, days: christmas.days, card: { key: "", kind: "christmas" as const, month: null, next: false, kids: orderKids(children).map((k) => toKid(k, null, "christmas")) } }]
      : []),
  ];
  // Närmast först; en födelsedag på julafton kommer före julkortet
  // Nyckeln är kortets plats i leken, aldrig datumet: dagen får inte skickas till webbläsaren
  const cards = entries.sort((a, b) => a.days - b.days || a.rank - b.rank).map((e, i) => ({ ...e.card, key: `kort-${i}` }));
  if (cards.length > 0) cards[0].next = true;
  return cards;
}
