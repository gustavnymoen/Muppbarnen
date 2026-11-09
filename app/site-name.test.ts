import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { SITE_NAME } from "./components/SiteHeader";
import manifest from "./manifest";

const kb = (file: string) => readFileSync(file).length / 1024;

describe("MUPP-046-R1 R2 the name and the manifest", () => {
  test("MUPP-046-R1 the site is called Kusinportalen", () => {
    expect(SITE_NAME).toBe("Kusinportalen");
  });

  test("MUPP-046-R2 the manifest names the site and lists the two PNG icons", () => {
    const m = manifest();
    expect(m).toMatchObject({ name: "Kusinportalen", short_name: "Kusinportalen", lang: "sv", background_color: "#0C1015", theme_color: "#0C1015" });
    expect(m.icons).toEqual([
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ]);
  });
});

describe("MUPP-046-R3 the icon files", () => {
  test("MUPP-046-R3 icon.svg is small and holds no script, link or embedded image", () => {
    const svg = readFileSync("app/icon.svg", "utf8");
    expect(kb("app/icon.svg")).toBeLessThan(5);
    expect(svg).not.toMatch(/<script|<image|href=|url\(|https?:\/\/(?!www\.w3\.org)/i);
    expect(svg).toContain("<title>Kusinportalen</title>");
  });

  test("MUPP-046-R3 icon.png is 192 px with transparent corners", async () => {
    const image = sharp("app/icon.png");
    expect(await image.metadata()).toMatchObject({ width: 192, height: 192, format: "png", hasAlpha: true });
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0); // översta vänstra pixelns alfa
    expect(kb("app/icon.png")).toBeLessThan(20);
  });

  test("MUPP-046-R3 apple-icon.png is 180 px, square and opaque in the page colour", async () => {
    const image = sharp("app/apple-icon.png");
    expect(await image.metadata()).toMatchObject({ width: 180, height: 180, format: "png", hasAlpha: false });
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    expect([...data.subarray(0, 3)]).toEqual([0x0c, 0x10, 0x15]);
    expect(kb("app/apple-icon.png")).toBeLessThan(20);
  });
});
