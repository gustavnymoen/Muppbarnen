import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

// True when the tests run against the local test server (npm run test:local),
// false against the live site. Tests that change shared data in a way that
// can't be undone run only locally.
export const runsLocally = (process.env.BASE_URL ?? "").startsWith("http://localhost");

// A name no one else uses, so tests can create data without clashing with
// real data, and find and delete it afterwards. "E2E" marks it as test data.
export function uniqueName(prefix: string) {
  return `E2E ${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

// Signs in on /admin with the admin password and, when a parent is named, chooses
// who you are. The password is the made-up one playwright.config.ts gives the local test server.
export async function adminSignIn(page: Page, parentName?: string) {
  await page.goto("/admin");
  await page.getByLabel("Adminlösenord").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Logga in" }).click();
  if (parentName) {
    await page.getByRole("button", { name: parentName, exact: true }).click();
    // The choice is stored when the page shows "Byt förälder"; a page opened before that has no parent
    await expect(page.getByRole("button", { name: "Byt förälder" })).toBeVisible();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
}

// A translucent colour, "rgba(…)" or "color(srgb …)", laid over an opaque
// background, as "rgb(…)"
export function layer(color: string, background: string) {
  const [br, bg, bb] = background.match(/[\d.]+/g)!.map(Number);
  const [r, g, b, alpha = 1] = color.match(/[\d.]+/g)!.map(Number);
  // color(srgb …) gives the channels from 0 to 1
  const scale = color.startsWith("color(srgb") ? 255 : 1;
  const mix = (f: number, k: number) => Math.round(f * scale * alpha + k * (1 - alpha));
  return `rgb(${mix(r, br)}, ${mix(g, bg)}, ${mix(b, bb)})`;
}

// WCAG contrast ratio between a foreground ("rgb(…)", "rgba(…)" or "color(srgb …)")
// and an opaque "rgb(…)" background. A translucent foreground is first laid over it.
export function contrast(foreground: string, background: string) {
  const luminance = (color: string) => {
    const [r, g, b] = color.match(/[\d.]+/g)!.map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luminance(layer(foreground, background));
  const l2 = luminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// The first non-transparent background behind an element (the surfaces are opaque)
export function backgroundOf(locator: Locator) {
  return locator.evaluate((el) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      const bg = getComputedStyle(e).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    }
    return getComputedStyle(document.body).backgroundColor;
  });
}

// A computed CSS value of an element (or of its ::before/::after)
export const css = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [property, pseudo] as const);

// A message is coloured text: no background, no border
export async function expectTextMessage(message: Locator, color: string) {
  await expect(message).toBeVisible();
  await expect(message).toHaveCSS("color", color);
  await expect(message).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(message).toHaveCSS("border-top-width", "0px");
}

// Waits until an element's animations and transitions (its own and those
// inside it) have finished. Until then something fading in (a dialog) is
// half transparent and a colour is between two values, so contrast can't be measured.
export async function animationsDone(locator: Locator) {
  await locator.evaluate((el) => Promise.allSettled(el.getAnimations({ subtree: true }).map((a) => a.finished)));
}

// Runs axe on the page as it looks right now and requires that it breaks no
// WCAG 2.x level A or AA rule. axe finds only some of the
// problems; the rest is checked by hand.
export async function expectNoA11yViolations(page: Page) {
  // Elements that fade in are partly see-through while they move, which axe
  // reads as low contrast: wait for running animations first
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  // The title is streamed in with the page, so it can be missing for a
  // moment (axe rule document-title)
  await expect(page).toHaveTitle(/.+/);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // Something faded on purpose and hidden from screen readers (decoration,
    // WCAG 1.4.3 exception) can be left out here, with a comment saying why:
    // .exclude('[aria-hidden="true"].decoration')
    .analyze();
  // Rule, description and elements, so that a failure can be understood from the report
  const violations = results.violations.map((v) => ({
    rule: v.id,
    help: v.help,
    elements: v.nodes.map((n) => n.target.join(" ")),
  }));
  expect(violations).toEqual([]);
}

// Designens tokens från app/globals.css, som webbläsaren anger dem
export const PAGE = "rgb(12, 16, 21)";
export const CARD = "rgb(20, 25, 32)";
export const EDGE = "rgb(39, 46, 57)";
export const SHADOW = "rgb(5, 8, 13)";
export const BRAND = "rgb(154, 169, 224)";
export const DANGER = "rgb(232, 147, 143)";

// Picks an option in the site's own list (ListPicker, MUPP-012) with the pointer: opens the
// field with that label in `scope` and activates the option
export async function pickOption(page: Page, scope: Locator, label: string, option: string) {
  await scope.getByRole("button", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}
