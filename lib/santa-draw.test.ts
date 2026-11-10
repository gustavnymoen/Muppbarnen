import { describe, expect, test } from "vitest";
import { drawPairs, type Drawable } from "./santa-draw";

// Påhittade deltagare med id 1..n; couples: [a, b] är partners
const group = (n: number, couples: [number, number][] = []): Drawable[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, partnerId: couples.flatMap(([a, b]) => (a === i + 1 ? [b] : b === i + 1 ? [a] : []))[0] ?? null }));

const pairsOf = (members: Drawable[], lastYear = new Map<number, number>()) => {
  const result = drawPairs(members, lastYear);
  if (!result.ok) throw new Error("ingen dragning");
  return result;
};

describe("MUPP-041-R3 the draw rules", () => {
  test("MUPP-041-R3 many random draws: everybody gives to one and gets from one, never themself, their partner or last year's person", () => {
    const members = group(8, [[1, 2], [3, 4]]);
    const lastYear = new Map([[1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 1], [8, 2]]);
    for (let run = 0; run < 500; run++) {
      const { pairs, setAside } = pairsOf(members, lastYear);
      expect(setAside).toEqual([]);
      expect([...pairs.keys()].sort()).toEqual(members.map((m) => m.id));
      expect([...pairs.values()].sort()).toEqual(members.map((m) => m.id));
      for (const m of members) {
        const to = pairs.get(m.id)!;
        expect(to).not.toBe(m.id);
        expect(to).not.toBe(m.partnerId);
        expect(to).not.toBe(lastYear.get(m.id));
      }
    }
  });

  test("MUPP-041-R3 the draw can be asymmetric and vary: A→B does not force B→A, and not every run gives the same result", () => {
    const members = group(5);
    const seen = new Set<string>();
    for (let run = 0; run < 50; run++) seen.add(JSON.stringify([...pairsOf(members).pairs]));
    expect(seen.size).toBeGreaterThan(1);
  });

  test("MUPP-041-R3 when last year's rule cannot be kept it is set aside first, and the partner rule goes second", () => {
    // Tre personer har bara två möjliga cirklar; förra året förbjuder 1→2 och 2→1, som finns en i varje cirkel
    const lastYear = new Map([[1, 2], [2, 1]]);
    expect(pairsOf(group(3), lastYear).setAside).toEqual(["lastYear"]);
    // Med två partners går det inte heller utan att släppa partnerregeln
    expect(pairsOf(group(3, [[1, 3]]), lastYear).setAside).toEqual(["lastYear", "partner"]);
  });

  test("MUPP-041-R3 two people who are partners are still drawn, with the partner rule set aside and the admin told which", () => {
    const result = pairsOf(group(2, [[1, 2]]));
    expect(result.setAside).toEqual(["lastYear", "partner"]);
    expect(result.pairs).toEqual(new Map([[1, 2], [2, 1]]));
  });

  test("MUPP-041-R3 a single member, or nobody, cannot be drawn", () => {
    expect(drawPairs(group(1), new Map())).toEqual({ ok: false });
    expect(drawPairs([], new Map())).toEqual({ ok: false });
  });

  test("MUPP-041-R3 a tight group the random tries seldom solve is still solved exactly: a draw exists whenever one is possible", () => {
    // 30 personer i par, och förra årets person också förbjuden: nästan en enda dragning går
    const members = group(30, Array.from({ length: 15 }, (_, i) => [2 * i + 1, 2 * i + 2] as [number, number]));
    const lastYear = new Map(members.map((m) => [m.id, (m.id % 30) + 1]));
    for (let run = 0; run < 20; run++) {
      const { pairs, setAside } = pairsOf(members, lastYear);
      expect(setAside).toEqual([]);
      expect(new Set(pairs.values()).size).toBe(30);
    }
  });
});
