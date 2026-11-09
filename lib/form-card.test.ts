import { describe, expect, test } from "vitest";
import { enterAction, savedMessage, shortTitle, type FieldKind } from "./form-card";

describe("MUPP-045-R6 shortTitle", () => {
  test("keeps an empty title, and one of exactly 25 characters", () => {
    expect(shortTitle("")).toBe("");
    expect(shortTitle("a".repeat(25))).toBe("a".repeat(25));
  });

  test("cuts 26 characters to the first 24 and an ellipsis", () => {
    expect(shortTitle("a".repeat(26))).toBe(`${"a".repeat(24)}…`);
  });

  test("leaves no space before the ellipsis", () => {
    expect(shortTitle(`${"a".repeat(23)} bbbbbb`)).toBe(`${"a".repeat(23)}…`);
  });

  test("ignores spaces around the title", () => {
    expect(shortTitle("  fotboll ")).toBe("fotboll");
  });

  test("keeps HTML as the text it is", () => {
    expect(shortTitle("<b>x</b>")).toBe("<b>x</b>");
  });
});

describe("MUPP-045-R6 R7 savedMessage", () => {
  const read = (field: string) => ({ title: " fotboll ", name: "Otis" })[field] ?? "";

  test("a fixed text is said as it is", () => {
    expect(savedMessage("Storlekarna för Otis sparades", read)).toBe("Storlekarna för Otis sparades");
  });

  test("names what was typed, added or saved", () => {
    expect(savedMessage({ field: "title", added: true }, read)).toBe("fotboll lades till");
    expect(savedMessage({ field: "name" }, read)).toBe("Otis sparades");
  });

  test("a short name is cut to fit a line", () => {
    const long = () => "a".repeat(40);
    expect(savedMessage({ field: "title", added: true, short: true }, long)).toBe(`${"a".repeat(24)}… lades till`);
    expect(savedMessage({ field: "title", added: true }, long)).toBe(`${"a".repeat(40)} lades till`);
  });

  test("an empty name still gives a sentence", () => {
    expect(savedMessage({ field: "title", added: true }, () => "")).toBe("Det lades till");
  });
});

describe("MUPP-045-R5 enterAction", () => {
  // Namn, Storlek, Beskrivning, Länk, Obegränsad
  const wish: FieldKind[] = ["text", "text", "textarea", "text", "checkbox"];

  test("moves to the next text field, also a text area", () => {
    expect(enterAction(wish, 0)).toEqual({ do: "focus", index: 1 });
    expect(enterAction(wish, 1)).toEqual({ do: "focus", index: 2 });
  });

  test("a text area keeps its new line", () => {
    expect(enterAction(wish, 2)).toEqual({ do: "default" });
  });

  test("submits from the last text field, a checkbox after it does not count", () => {
    expect(enterAction(wish, 3)).toEqual({ do: "submit" });
  });

  test("a form with one field submits", () => {
    expect(enterAction(["text"], 0)).toEqual({ do: "submit" });
  });

  test("a list, a checkbox and a file do what they always did", () => {
    const kinds: FieldKind[] = ["text", "list", "checkbox", "file"];
    expect([1, 2, 3].map((i) => enterAction(kinds, i))).toEqual([{ do: "default" }, { do: "default" }, { do: "default" }]);
  });

  test("a list is skipped on the way", () => {
    expect(enterAction(["text", "list", "text"], 0)).toEqual({ do: "focus", index: 2 });
    expect(enterAction(["text", "list"], 0)).toEqual({ do: "submit" });
  });

  test("a word being composed does not move or submit", () => {
    expect(enterAction(wish, 0, true)).toEqual({ do: "default" });
  });
});
