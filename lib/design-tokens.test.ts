import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { swatches } from "@/app/design/tokens";
import { CHILD_COLORS } from "./child-colors";

// Läser tokens ur app/globals.css, som de står i koden
const css = readFileSync("app/globals.css", "utf8");
const designDoc = readFileSync("DESIGN.md", "utf8");

const tokens = Object.fromEntries([...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2].toUpperCase()]));

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (a: Rgb, b: Rgb, share: number): Rgb => a.map((v, i) => v * share + b[i] * (1 - share)) as Rgb;

function luminance(color: Rgb) {
  const [r, g, b] = color.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const color = (name: string) => rgb(tokens[name]);
const children = CHILD_COLORS.map((name) => [name, color(`child-${name}`)] as const);

describe("MUPP-001-R1 colour tokens", () => {
  test("MUPP-001-R1 text, muted text and error text have at least 4.5:1 on the page and the card", () => {
    for (const fg of ["text", "muted", "danger"]) {
      for (const bg of ["page", "card"]) expect(ratio(color(fg), color(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("MUPP-001-R1 text on the brand colour and on every child chip has at least 4.5:1", () => {
    expect(ratio(color("on-brand"), color("brand"))).toBeGreaterThanOrEqual(4.5);
    for (const [name, c] of children) {
      expect(ratio(c, mix(c, color("card"), 0.16)), `${name} chip`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("MUPP-001-R1 child rings and highlight edges have at least 3:1 on the card", () => {
    for (const [name, c] of children) {
      expect(ratio(mix(c, color("card"), 0.65), color("card")), `${name} ring`).toBeGreaterThanOrEqual(3);
      expect(ratio(mix(c, color("card"), 0.6), color("card")), `${name} edge`).toBeGreaterThanOrEqual(3);
    }
  });

  test("MUPP-001-R1 the buttons stand out from what is behind them", () => {
    expect(ratio(color("brand"), color("page"))).toBeGreaterThanOrEqual(3);
    // kanten på sekundär- och ikonknappen: muted vid 75 % över kortet
    expect(ratio(mix(color("muted"), color("card"), 0.75), color("card"))).toBeGreaterThanOrEqual(3);
  });

  test("MUPP-001-R1 DESIGN.md lists every token with the value in the code", () => {
    expect(Object.keys(tokens).length).toBeGreaterThanOrEqual(15);
    for (const [name, value] of Object.entries(tokens)) {
      expect(designDoc, `--color-${name}`).toMatch(new RegExp(`\`--color-${name}\`\\s*\\|\\s*\`${value}\``, "i"));
    }
  });

  test("MUPP-001-R8 the style guide shows the values of the tokens in the code", () => {
    for (const { token, hex } of swatches) expect(tokens[token], token).toBe(hex);
    // Himmel, som bilden i stilguiden är målad med
    expect(readFileSync("app/design/page.tsx", "utf8")).toContain(`"${tokens["child-sky"]}"`);
  });
});
