import { describe, expect, test } from "vitest";
import { buildDeck, dayAndMonth, isArchived, isoDate, nextOccurrence, occasionOf, parseDate, type DeckInput, type Sizes, type Wish, type Wishes } from "./deck";

const today = { year: 2026, month: 10, day: 28 };
// Påhittade barn
const noSizes: Sizes = { clothes: "", shoes: "", head: "", gloves: "" };
const kid = (id: number, name: string, birthdate: string, parentId = 1, sizes: Sizes = noSizes): DeckInput => ({ id, parentId, name, birthdate, picture: "", sizes });
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
  test("holds the day, month and age but not the birthdate or the year", () => {
    const deck = buildDeck([kid(1, "A", "2019-03-17")], noWishes, today);
    const keys = (value: object) => Object.keys(value).sort();
    for (const card of deck) {
      expect(keys(card)).toEqual(["after", "day", "key", "kids", "kind", "month", "next"]);
      expect(keys(card.kids[0])).toEqual(["age", "color", "expected", "id", "name", "picture", "sizes", "wishes"]);
    }
    expect(JSON.stringify(deck)).not.toContain("2019-03-17");
    expect(deck.find((c) => c.kind === "birthday")).toMatchObject({ day: 17, month: 3, kids: [{ age: 8 }] });
    expect(JSON.stringify(deck)).not.toContain("2019");
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

  test("MUPP-011-R3 MUPP-031-R6 a child born today or up to 30 days ago is Född (age 0); after that the next birthday is the first one", () => {
    const born = (birthdate: string) => buildDeck([kid(1, "A", birthdate)], noWishes, today).find((c) => c.kind === "birthday")!;
    expect(born("2026-10-28")).toMatchObject({ day: 28, month: 10, after: false, kids: [{ age: 0, expected: false }] });
    expect(born("2026-10-27")).toMatchObject({ day: 27, month: 10, after: true, kids: [{ age: 0 }] });
    expect(born("2026-09-28").kids[0].age).toBe(0);
    expect(born("2026-09-27")).toMatchObject({ day: 27, month: 9, after: false, kids: [{ age: 1 }] });
    expect(born("2026-02-14").kids[0].age).toBe(1);
  });

  test("MUPP-011-R3 MUPP-031-R6 an expected child turns into an ordinary one on the day, born", () => {
    const deck = (day: number) => buildDeck([kid(1, "A", "2026-10-30")], noWishes, { year: 2026, month: 10, day }).find((c) => c.kind === "birthday")!;
    expect(deck(29).kids[0]).toMatchObject({ age: null, expected: true });
    expect(deck(30)).toMatchObject({ day: 30, month: 10, after: false, kids: [{ age: 0, expected: false }] });
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

describe("MUPP-020 day and month on the card", () => {
  const birthday = (kids: DeckInput[], on = today) => buildDeck(kids, noWishes, on).find((c) => c.kind === "birthday")!;

  test("MUPP-020-R1 the card holds the day once and the kids hold none", () => {
    const card = birthday([kid(1, "A", "2019-03-17"), kid(2, "B", "2021-03-17")]);
    expect(card).toMatchObject({ day: 17, month: 3 });
    expect(card.kids.map((k) => "day" in k)).toEqual([false, false]);
    expect(dayAndMonth(card.day!, card.month!)).toBe("17 mars");
  });

  test("MUPP-020-R2 an expected kid's card has the date of the birth", () => {
    expect(birthday([kid(1, "Väntad", "2027-03-05")])).toMatchObject({ day: 5, month: 3, kids: [{ age: null, expected: true }] });
  });

  test("MUPP-020-R3 29 February is shown as 28 February in a year without one", () => {
    const born = [kid(1, "Skott", "2020-02-29")];
    expect(birthday(born, { year: 2026, month: 12, day: 1 })).toMatchObject({ day: 28, month: 2 });
    expect(birthday(born, { year: 2027, month: 12, day: 1 })).toMatchObject({ day: 29, month: 2 });
  });
});

describe("MUPP-031 the month after the occasion", () => {
  const birthdays = (kids: DeckInput[], date: string) => buildDeck(kids, noWishes, parseDate(date)).filter((c) => c.kind === "birthday");
  const christmas = (date: string) => buildDeck([kid(1, "A", "2019-03-17")], noWishes, parseDate(date)).find((c) => c.kind === "christmas")!;
  const alma = kid(1, "Alma", "2019-03-17");

  test("MUPP-031-R1 the birthday itself is upcoming; day 1 and day 30 after keep the card with the age just turned", () => {
    expect(birthdays([alma], "2026-03-17")).toMatchObject([{ day: 17, month: 3, after: false, next: true, kids: [{ age: 7 }] }]);
    for (const date of ["2026-03-18", "2026-04-16"]) expect(birthdays([alma], date), date).toMatchObject([{ day: 17, month: 3, after: true, next: false, kids: [{ age: 7 }] }]);
  });

  test("MUPP-031-R1 day 31 the card is next year's, with the next age", () => {
    expect(birthdays([alma], "2026-04-17")).toMatchObject([{ day: 17, month: 3, after: false, kids: [{ age: 8 }] }]);
  });

  test("MUPP-031-R1 R2 one birthday card per kid and one Christmas Eve card on every day of a year", () => {
    const kids = [alma, kid(2, "Otto", "2020-12-24"), kid(3, "Skott", "2020-02-29"), kid(4, "Ny", "2026-01-10")];
    for (let i = 0; i < 366; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i));
      const deck = buildDeck(kids, noWishes, { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
      const ids = deck.filter((c) => c.kind === "birthday").flatMap((c) => c.kids.map((k) => k.id));
      expect(ids.sort(), date.toISOString()).toEqual([1, 2, 3, 4]);
      expect(deck.filter((c) => c.kind === "christmas")).toHaveLength(1);
    }
  });

  test("MUPP-031-R1 29 February counts from 28 February in a year without one", () => {
    const skott = kid(1, "Skott", "2020-02-29");
    expect(birthdays([skott], "2027-03-30")).toMatchObject([{ day: 28, month: 2, after: true, kids: [{ age: 7 }] }]);
    expect(birthdays([skott], "2027-03-31")).toMatchObject([{ day: 29, month: 2, after: false, kids: [{ age: 8 }] }]);
  });

  test("MUPP-031-R2 Christmas Eve stays from 25 December to 23 January, across the new year; 24 January it is the next one", () => {
    for (const date of ["2026-12-25", "2026-12-31", "2027-01-01", "2027-01-23"]) expect(christmas(date).after, date).toBe(true);
    for (const date of ["2026-12-24", "2027-01-24"]) expect(christmas(date).after, date).toBe(false);
  });

  test("MUPP-031-R3 cards in the month after lie just before the next card, the most recent nearest, and the deck starts on the next", () => {
    const kids = [kid(1, "Tio", "2019-10-18"), kid(2, "Tjugo", "2019-10-08"), kid(3, "Fem", "2019-11-02")];
    const deck = buildDeck(kids, noWishes, today);
    expect(deck.map((c) => [c.kind, c.kids[0].name, c.after])).toEqual([
      ["birthday", "Tjugo", true],
      ["birthday", "Tio", true],
      ["birthday", "Fem", false],
      ["christmas", "Tjugo", false],
    ]);
    expect(deck.map((c) => c.next)).toEqual([false, false, true, false]);
  });

  test("MUPP-031-R3 a card that resets moves to its place among the upcoming cards", () => {
    const kids = [alma, kid(2, "Otto", "2019-05-01")];
    expect(buildDeck(kids, noWishes, parseDate("2026-04-16")).map((c) => [c.kind, c.month, c.next])).toEqual([["birthday", 3, false], ["birthday", 5, true], ["christmas", null, false]]);
    expect(buildDeck(kids, noWishes, parseDate("2026-04-17")).map((c) => [c.kind, c.month, c.next])).toEqual([["birthday", 5, true], ["christmas", null, false], ["birthday", 3, false]]);
  });

  test("MUPP-031-R6 Beräknad before the birthdate, Född from it to day 30, then Fyller 1 år", () => {
    const newborn = kid(1, "Ny", "2026-10-20");
    expect(birthdays([newborn], "2026-10-19")).toMatchObject([{ day: 20, month: 10, after: false, kids: [{ age: null, expected: true }] }]);
    expect(birthdays([newborn], "2026-10-20")).toMatchObject([{ day: 20, month: 10, after: false, kids: [{ age: 0, expected: false }] }]);
    expect(birthdays([newborn], "2026-10-21")).toMatchObject([{ after: true, kids: [{ age: 0 }] }]);
    expect(birthdays([newborn], "2026-11-19")).toMatchObject([{ after: true, kids: [{ age: 0 }] }]);
    expect(birthdays([newborn], "2026-11-20")).toMatchObject([{ day: 20, month: 10, after: false, kids: [{ age: 1 }] }]);
  });
});

describe("MUPP-031-R4 which occasion a wish belongs to, and when it is archived", () => {
  const alma = { birthdate: "2019-03-17" };
  const archived = (kind: "birthday" | "christmas", addedAt: string, date: string, who = alma) => isArchived(who, kind, addedAt, parseDate(date));

  test("MUPP-031-R4 a wish added before the birthday stays to day 30 after it and is archived on day 31", () => {
    expect(archived("birthday", "2026-03-01", "2026-04-16")).toBe(false);
    expect(archived("birthday", "2026-03-01", "2026-04-17")).toBe(true);
  });

  test("MUPP-031-R4 a wish added during the month after belongs to the birthday that just passed", () => {
    expect(isoDate(occasionOf(alma, "birthday", parseDate("2026-04-10")))).toBe("2026-03-17");
    expect(archived("birthday", "2026-04-10", "2026-04-16")).toBe(false);
    expect(archived("birthday", "2026-04-10", "2026-04-17")).toBe(true);
    expect(archived("birthday", "2026-04-17", "2026-04-17")).toBe(false);
  });

  test("MUPP-031-R4 Christmas Eve: a wish added in January belongs to the Christmas Eve before, and is archived on 24 January", () => {
    expect(isoDate(occasionOf(alma, "christmas", parseDate("2027-01-10")))).toBe("2026-12-24");
    expect(archived("christmas", "2027-01-10", "2027-01-23")).toBe(false);
    expect(archived("christmas", "2027-01-10", "2027-01-24")).toBe(true);
  });

  test("MUPP-031-R4 R6 a list made before the birth belongs to the birth and is archived 31 days after it", () => {
    const newborn = { birthdate: "2026-10-20" };
    expect(archived("birthday", "2026-07-01", "2026-11-19", newborn)).toBe(false);
    expect(archived("birthday", "2026-07-01", "2026-11-20", newborn)).toBe(true);
  });
});
