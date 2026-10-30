import { describe, expect, test } from "vitest";
import { buildDeck, nextOccurrence, type DeckInput, type Sizes, type Wish, type Wishes } from "./deck";

const today = { year: 2026, month: 10, day: 28 };
// Påhittade barn
const noSizes: Sizes = { clothes: "", shoes: "", head: "", gloves: "" };
const kid = (id: number, name: string, birthdate: string, parentId = 1, sizes: Sizes = noSizes): DeckInput => ({ id, parentId, name, birthdate, hasPicture: false, sizes });
const noWishes: Wishes = new Map();
const wish = (id: number, title: string, extra: Partial<Wish> = {}): Wish => ({ id, title, description: "", size: "", url: "", unlimited: false, claimedBy: null, claimedAt: null, ...extra });

describe("MUPP-004-R2 next occurrence", () => {
  test("today counts", () => expect(nextOccurrence(10, 28, today).days).toBe(0));
  test("tomorrow", () => expect(nextOccurrence(10, 29, today).days).toBe(1));
  test("a date that has passed this year comes next year", () => expect(nextOccurrence(10, 27, today)).toMatchObject({ year: 2027, days: 364 }));
  test("29 February counts as 28 February in years without one", () => {
    expect(nextOccurrence(2, 29, today)).toMatchObject({ year: 2027, day: 28 });
    expect(nextOccurrence(2, 29, { year: 2027, month: 12, day: 1 })).toMatchObject({ year: 2028, day: 29 });
  });
  test("24 December", () => expect(nextOccurrence(12, 24, today).days).toBe(57));
});

describe("MUPP-004-R2 the deck", () => {
  test("one card per date, nearest first, then Christmas Eve, and only the first is next", () => {
    const deck = buildDeck([kid(1, "Alma", "2019-03-03"), kid(2, "Otto", "2021-11-14")], noWishes, today);
    expect(deck.map((c) => [c.kind, c.month])).toEqual([["birthday", 11], ["christmas", null], ["birthday", 3]]);
    expect(deck.map((c) => c.next)).toEqual([true, false, false]);
  });

  test("kids with the same birthday share a card, grouped by parent with the oldest first", () => {
    const deck = buildDeck(
      [kid(1, "Yngre", "2022-06-21", 1), kid(2, "Andra", "2020-06-21", 2), kid(3, "Äldre", "2018-06-21", 1)],
      noWishes,
      today,
    );
    const card = deck.find((c) => c.month === 6)!;
    expect(card.kids.map((k) => k.name)).toEqual(["Äldre", "Yngre", "Andra"]);
    expect(card.kids.map((k) => k.age)).toEqual([9, 5, 7]);
  });

  test("a birthday on 24 December comes before the Christmas Eve card", () => {
    const deck = buildDeck([kid(1, "Jul", "2020-12-24")], noWishes, today);
    expect(deck.map((c) => c.kind)).toEqual(["birthday", "christmas"]);
  });

  test("Christmas Eve holds every kid without age; no kids means no cards", () => {
    const deck = buildDeck([kid(1, "A", "2020-01-01"), kid(2, "B", "2021-02-02")], noWishes, today);
    expect(deck.find((c) => c.kind === "christmas")!.kids.map((k) => k.age)).toEqual([null, null]);
    expect(buildDeck([], noWishes, today)).toEqual([]);
  });

  test("each card shows the wishes of its occasion", () => {
    const wishes: Wishes = new Map([[1, { birthday: [wish(1, "Cykel")], christmas: [wish(2, "Pussel")] }]]);
    const deck = buildDeck([kid(1, "A", "2020-11-01")], wishes, today);
    expect(deck[0].kids[0].wishes).toEqual([wish(1, "Cykel")]);
    expect(deck[1].kids[0].wishes).toEqual([wish(2, "Pussel")]);
  });
});

describe("MUPP-004-R6 the data for the browser", () => {
  test("holds the month and the age but not the day or the birthdate", () => {
    const deck = buildDeck([kid(1, "A", "2019-03-17")], noWishes, today);
    const keys = (value: object) => Object.keys(value).sort();
    for (const card of deck) {
      expect(keys(card)).toEqual(["key", "kids", "kind", "month", "next"]);
      expect(keys(card.kids[0])).toEqual(["age", "color", "expected", "hasPicture", "id", "name", "sizes", "wishes"]);
    }
    expect(JSON.stringify(deck)).not.toContain("2019-03-17");
    expect(deck.find((c) => c.kind === "birthday")).toMatchObject({ month: 3, kids: [{ age: 8 }] });
  });
});

describe("MUPP-011 a child who is not born yet", () => {
  test("MUPP-011-R2 is expected: no age, the card is at its place by date, and the date stays on the server", () => {
    const deck = buildDeck([kid(1, "Väntad", "2027-03-05"), kid(2, "Annan", "2020-12-01")], noWishes, today);
    expect(deck.map((c) => [c.kind, c.month])).toEqual([["birthday", 12], ["christmas", null], ["birthday", 3]]);
    expect(deck[2].kids[0]).toMatchObject({ name: "Väntad", age: null, expected: true });
    expect(deck[1].kids.map((k) => k.expected)).toEqual([false, false]);
    expect(JSON.stringify(deck)).not.toContain("2027-03-05");
  });

  test("MUPP-011-R3 a born child is never 0 years: the next birthday is the first one", () => {
    const born = (birthdate: string) => buildDeck([kid(1, "A", birthdate)], noWishes, today).find((c) => c.kind === "birthday")!;
    expect(born("2026-10-28")).toMatchObject({ month: 10, kids: [{ age: 1, expected: false }] });
    expect(born("2026-10-27").kids[0].age).toBe(1);
    expect(born("2026-02-14").kids[0].age).toBe(1);
  });

  test("MUPP-011-R3 an expected child turns into an ordinary one on the day", () => {
    const deck = (day: number) => buildDeck([kid(1, "A", "2026-10-30")], noWishes, { year: 2026, month: 10, day }).find((c) => c.kind === "birthday")!;
    expect(deck(29).kids[0]).toMatchObject({ age: null, expected: true });
    expect(deck(30).kids[0]).toMatchObject({ age: 1, expected: false });
  });
});

describe("MUPP-014-R1 sizes reach the deck", () => {
  test("every kid of every card has its four sizes as trimmed text", () => {
    const sizes = { clothes: " 122 ", shoes: "30", head: "", gloves: "S\n" };
    const deck = buildDeck([kid(1, "A", "2019-03-17", 1, sizes)], noWishes, today);
    for (const card of deck) expect(card.kids[0].sizes).toEqual({ clothes: "122", shoes: "30", head: "", gloves: "S" });
  });

  test("a kid with no sizes has four empty texts", () => {
    const deck = buildDeck([kid(1, "A", "2019-03-17")], noWishes, today);
    expect(deck.flatMap((c) => c.kids.map((k) => k.sizes))).toEqual([noSizes, noSizes]);
  });

  test("the birthdate and the day still stay on the server", () => {
    const deck = buildDeck([kid(1, "A", "2019-03-17", 1, { ...noSizes, clothes: "122" })], noWishes, today);
    expect(JSON.stringify(deck)).not.toContain("2019-03-17");
  });
});
