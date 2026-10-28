import { childColor, type ChildColor } from "./child-colors";

// Kortleken på startsidan (MUPP-004): vilka kort som finns, i vilken ordning och vad som
// får skickas till webbläsaren. Rent data in och ut, så att det går att testa utan databas.

export type DeckInput = { id: number; parentId: number; name: string; birthdate: string; hasPicture: boolean };
export type Wish = { id: number; title: string };
export type Wishes = Map<number, { birthday: Wish[]; christmas: Wish[] }>;
export type Today = { year: number; month: number; day: number };

// Det som webbläsaren får: månad och ålder, aldrig dagen eller födelsedatumet (R6)
export type DeckKid = { id: number; name: string; age: number | null; color: ChildColor; hasPicture: boolean; wishes: Wish[] };
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

// Nästa gång månaden och dagen kommer, räknat från idag (idag räknas). Den 29 februari
// firas den 28:e de år som inte har någon 29:e.
export function nextOccurrence(month: number, day: number, today: Today) {
  const inYear = (year: number) => (month === 2 && day === 29 && !isLeapYear(year) ? 28 : day);
  const from = dayNumber(today.year, today.month, today.day);
  let year = today.year;
  if (dayNumber(year, month, inYear(year)) < from) year += 1;
  const date = inYear(year);
  return { year, month, day: date, days: dayNumber(year, month, date) - from };
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
  const wishesOf = (id: number, occasion: "birthday" | "christmas") => wishes.get(id)?.[occasion] ?? [];
  const toKid = (kid: DeckInput, age: number | null, occasion: "birthday" | "christmas"): DeckKid => ({
    id: kid.id,
    name: kid.name,
    age,
    color: childColor(kid.id),
    hasPicture: kid.hasPicture,
    wishes: wishesOf(kid.id, occasion),
  });

  // En födelsedagskort per datum
  const byDate = new Map<string, { days: number; month: number; kids: (DeckInput & { age: number })[] }>();
  for (const kid of children) {
    const born = parseBirthdate(kid.birthdate);
    const next = nextOccurrence(born.month, born.day, today);
    const key = `${next.month}-${next.day}`;
    const entry = byDate.get(key) ?? { days: next.days, month: next.month, kids: [] };
    entry.kids.push({ ...kid, age: next.year - born.year });
    byDate.set(key, entry);
  }

  const christmas = nextOccurrence(12, 24, today);
  const entries = [
    ...[...byDate.values()].map((entry) => ({ rank: 0, days: entry.days, card: { key: "", kind: "birthday" as const, month: entry.month, next: false, kids: orderKids(entry.kids).map((k) => toKid(k, k.age, "birthday")) } })),
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
