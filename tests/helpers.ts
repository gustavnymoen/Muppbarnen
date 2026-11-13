import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";
import { dayAndMonth, swedishToday } from "../lib/deck";
import { adminSessionFile } from "./site-session";

// True when the tests run against the local test server (npm run test:local),
// false against the live site. Tests that change shared data in a way that
// can't be undone run only locally.
export const runsLocally = (process.env.BASE_URL ?? "").startsWith("http://localhost");

// The date `days` days from today in Swedish time (negative: ago), as text, ÅÅÅÅ-MM-DD
export function dateIn(days: number) {
  const today = swedishToday();
  return new Date(Date.UTC(today.year, today.month - 1, today.day + days)).toISOString().slice(0, 10);
}

// A birth date so that the birthday comes in `days` days (negative: was, MUPP-031); the age is then 6; date is the card heading, "17 mars".
export function birthdateIn(days: number) {
  const [year, month, day] = dateIn(days).split("-").map(Number);
  return { birthdate: `${year - 6}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, date: dayAndMonth(day, month) };
}

// A name no one else uses, so tests can create data without clashing with
// real data, and find and delete it afterwards. "E2E" marks it as test data.
export function uniqueName(prefix: string) {
  return `E2E ${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

// Opens a page and waits until its content is shown. Every page streams its content
// (Suspense), and React shows it about 300 ms after the page has loaded; an expect
// after page.goto would see it only after Playwright's backoff, at 770 ms.
// waitForFunction checks on every frame instead (TECH-014). The pages are in the
// shell [data-page]; the password page has none, and streams only its form. Content
// not yet shown lies in a hidden element, so checkVisibility() is false until React
// shows it; a visible form before the shell, or a shell outside Suspense, would end
// the wait too early.
export async function goto(page: Page, path: string) {
  const response = await page.goto(path);
  await page.waitForFunction(() => document.querySelector("[data-page], form")?.checkVisibility());
  return response;
}

// Signs in on /admin with the admin cookie that tests/global-setup.ts got through the form
// once (TECH-014), and, when a parent is named, chooses who you are. The tests of the
// sign-in itself use the form instead.
export async function adminSignIn(page: Page, parentName?: string) {
  await page.context().addCookies(JSON.parse(readFileSync(adminSessionFile, "utf8")).cookies);
  await goto(page, "/admin");
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

// Browses the deck with "Nästa kort" until the card with this heading (a date or "Julafton") is in the middle
export async function toCard(page: Page, heading: string) {
  const card = page.getByRole("article");
  for (let i = 0; i < 4 && (await card.getByRole("heading", { level: 2 }).innerText()) !== heading; i++) {
    await page.getByRole("button", { name: "Nästa kort" }).click();
    await animationsDone(card);
  }
}

// Waits until every animation and transition on the page has finished, also those of
// elements that are removed when they end (the copy that moves when a view closes). An
// expect that waits for the end of an animation is otherwise checked again only after
// Playwright's backoff (0, 20, 70, 170, 270, then 770 ms), so a 300 ms animation cost
// 770 ms (TECH-014). Animations that never end (the spinner of a busy button, MUPP-072) are not waited for.
export async function pageAnimationsDone(page: Page) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished)));
}

// The box of an element once it has settled: visible, and the same in two reads 50 ms apart. A bare
// boundingBox() is read at once, so it can catch an element mid-animation (a height of 43.99
// instead of 44) or one the page is just re-rendering (null, which a "!" would hide). Both reads
// are made in the page, so a box costs one round trip instead of three (TECH-018). 50 ms and not
// two frames: a staggered entrance can stand still for a frame or two before it moves.
export async function settledBox(locator: Locator) {
  await expect(locator).toBeVisible();
  let box: Box | null = null;
  await expect
    .poll(
      async () => {
        box = await locator.evaluate(async (el) => {
          const read = () => JSON.stringify(el.getBoundingClientRect());
          const before = read();
          await new Promise((resolve) => setTimeout(resolve, 50));
          // A detached element reads as an empty box: it counts as not settled
          return el.isConnected && read() === before ? (JSON.parse(before) as Box) : null;
        });
        return box !== null;
      },
      { message: "the box never settled", intervals: [0] },
    )
    .toBe(true);
  return box!;
}

// The copy that moves when a wish list or a kid's view closes (transition.ts): in body, inert and hidden from screen readers
export const GHOST = "body > [inert][aria-hidden=true]";
export const ghost = (page: Page) => page.locator(GHOST);

// The transforms in the keyframes of the animations running on an element, in order
export const transformsOf = (el: Locator) =>
  el.evaluate((node) => node.getAnimations().flatMap((a) => (a.effect as KeyframeEffect).getKeyframes()).flatMap((k) => (k.transform ? [String(k.transform)] : [])));

// A wish list that grows or shrinks as a whole (transition.ts, MUPP-022, MUPP-029): `transform`
// (translate and scale from the top left corner) moves and scales the box `from` so that it covers `to`
export type Box = { x: number; y: number; width: number; height: number };
// Two boxes that do not overlap, and a box inside another (half a pixel's margin for rounding)
export const disjoint = (a: Box, b: Box) => a.x + a.width <= b.x + 0.5 || b.x + b.width <= a.x + 0.5 || a.y + a.height <= b.y + 0.5 || b.y + b.height <= a.y + 0.5;
export const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
export function expectOnto(transform: string, from: Box, to: Box) {
  const [dx, dy, sx, sy] = (transform.match(/-?[\d.]+(?=px|,|\))/g) ?? []).map(Number);
  for (const [got, want] of [[dx, to.x - from.x], [dy, to.y - from.y], [sx, to.width / from.width], [sy, to.height / from.height]]) expect(got).toBeCloseTo(want, 1);
}

// Runs axe on the page as it looks right now and requires that it breaks no
// WCAG 2.x level A or AA rule. axe finds only some of the
// problems; the rest is checked by hand.
export async function expectNoA11yViolations(page: Page) {
  // Elements that fade in are partly see-through while they move, which axe
  // reads as low contrast: wait for running animations first
  await pageAnimationsDone(page);
  // The title is streamed in with the page, so it can be missing for a
  // moment (axe rule document-title)
  await expect(page).toHaveTitle(/.+/);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // Something faded on purpose and hidden from screen readers (decoration,
    // WCAG 1.4.3 exception) can be left out here, with a comment saying why:
    // .exclude('[aria-hidden="true"].decoration')
    // The toast after a save is aria-hidden and moves on timers of its own (it slides in when the
    // save is answered and fades out two seconds later), so a wait for the animations that exist
    // now can miss it and axe reads it half see-through (TECH-019-R4). Its contrast is checked
    // when it has settled, in design.spec.ts (MUPP-054-R1 R3).
    .exclude("[data-toast]")
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

// Opens the form card behind a button ("Ändra …", "Ny önskning, …") unless one is open already, and gives the scope back (MUPP-045:
// the card is in the page's DOM next to its button, so a locator inside the scope finds its fields). A card that stays open after
// a save (a new wish) is left open and used again.
export async function openCard(scope: Locator, name: string | RegExp) {
  if ((await scope.locator("dialog[open]").count()) === 0) await scope.getByRole("button", { name }).click();
  await expect(scope.locator("dialog[open]")).toHaveCount(1);
  return scope;
}

// The card (an open <dialog>) with this title, wherever it is on the page
export const cardTitled = (page: Page, title: string | RegExp) => page.locator("dialog[open]").filter({ has: page.getByRole("heading", { level: 2, name: title }) });

// Signs in as a Secret Santa member (MUPP-039): the event (when there is more than one), the name and the saved phone number
export async function signInSanta(page: Page, event: string, name: string, phone: string) {
  await goto(page, "/secret-santa");
  const eventLink = page.getByRole("link", { name: event, exact: true });
  if (await eventLink.count()) await eventLink.click();
  await page.getByRole("link", { name, exact: true }).click();
  await page.getByLabel("Ditt telefonnummer").fill(phone);
  await page.getByRole("button", { name: "Fortsätt" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Hej ${name}!` })).toBeVisible();
}
