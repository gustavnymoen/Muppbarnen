import { describe, expect, test } from "vitest";
import { neighbours } from "./kid-neighbours";

describe("MUPP-083-R3 neighbours", () => {
  test("next and previous, circular", () => {
    expect(neighbours([1, 2, 3], 2)).toEqual({ previous: 1, next: 3 });
    expect(neighbours([1, 2, 3], 3)).toEqual({ previous: 2, next: 1 });
    expect(neighbours([1, 2, 3], 1)).toEqual({ previous: 3, next: 2 });
  });
  test("two kids point at each other", () => {
    expect(neighbours([4, 7], 4)).toEqual({ previous: 7, next: 7 });
  });
  test("one kid, or a kid not in the list, gives none", () => {
    expect(neighbours([5], 5)).toBeNull();
    expect(neighbours([1, 2], 9)).toBeNull();
  });
});
