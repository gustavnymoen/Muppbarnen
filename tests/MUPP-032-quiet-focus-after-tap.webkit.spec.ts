import { devices, expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily, setSizes } from "./family-db";
import { animationsDone, birthdateIn, goto, runsLocally, uniqueName } from "./helpers";

// Körs bara med `npm run test:webkit` (WebKit är inte installerat i CI): bara Safari på iPhone visar ringen efter ett tryck
test.skip(!runsLocally, "needs the local test database");
test.use({ ...devices["iPhone 13"], browserName: "webkit" });

const card = (page: Page) => page.getByRole("article");
const region = (page: Page) => card(page).getByRole("region", { name: "Önskelista" });
const dialog = (page: Page) => page.locator("dialog[open]");

test.beforeEach(async () => {
  await clearFamily();
});
test.afterAll(async () => {
  await clearFamily();
});

// Vera har ett kort för sig själv, med sparade storlekar, en paxad och en ledig önskning
async function openVerasList(page: Page) {
  const parent = await addParent(uniqueName("Förälder"));
  const vera = await addChild(parent, "Vera", birthdateIn(20).birthdate);
  await setSizes(vera, { clothes: "122" });
  await addWish(vera, "birthday", "Cykel");
  await addWish(vera, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
  await goto(page, "/");
  await animationsDone(card(page));
  await card(page).getByRole("button", { name: /^Önskelista/ }).tap();
  await expect(region(page)).toBeVisible();
  await animationsDone(card(page));
}

// Det som har fokus just nu: vad det är och vilken kantlinje det har
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement!;
    return { name: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 20) ?? "", outline: getComputedStyle(el).outlineStyle };
  });

// Tre dialoger: knappen som öppnar den (Paxa först efter att en önskning markerats) och knappen som stänger den
const dialogs = [
  {
    name: "Ta bort paxningen",
    open: (page: Page) => region(page).getByRole("button", { name: "Ta bort paxningen på Hoppborg" }),
    close: (page: Page) => dialog(page).getByRole("button", { name: "Avbryt" }),
  },
  {
    name: "Paxa",
    open: async (page: Page) => {
      await region(page).getByRole("checkbox", { name: /Cykel/ }).tap();
      return region(page).getByRole("button", { name: /^Paxa \(/ });
    },
    close: (page: Page) => dialog(page).getByRole("button", { name: "Avbryt" }),
  },
  {
    name: "Storlekar",
    open: (page: Page) => card(page).getByRole("button", { name: "Storlekar" }),
    close: (page: Page) => dialog(page).getByRole("button", { name: "Stäng" }),
  },
];

for (const { name, open, close } of dialogs) {
  test(`MUPP-032-R1 ${name}: no ring on the first control after a tap, nor on what gets the focus when it closes`, async ({ page }) => {
    await openVerasList(page);
    await (await open(page)).tap();
    await expect(dialog(page)).toBeVisible();
    expect((await focused(page)).outline).toBe("none");

    await close(page).tap();
    await expect(dialog(page)).toHaveCount(0);
    expect((await focused(page)).outline).toBe("none");
  });

  test(`MUPP-032-R2 ${name}: the ring after a key, and the focus is where it was`, async ({ page }) => {
    await openVerasList(page);
    const button = await open(page);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeVisible();
    expect((await focused(page)).outline).toBe("solid");

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    expect((await focused(page)).outline).toBe("solid");
  });
}

test("MUPP-032-R2 a tap followed by Tab shows the ring on the newly focused element", async ({ page }) => {
  await openVerasList(page);
  await region(page).getByRole("checkbox", { name: /Cykel/ }).tap();
  await region(page).getByRole("button", { name: /^Paxa \(/ }).tap();
  await expect(dialog(page)).toBeVisible();
  expect((await focused(page)).outline).toBe("none");
  // WebKit hoppar över knappar med Tab (som Safari), så en tur ut och in ger namnfältet fokus med Tab
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(dialog(page).getByLabel("Ditt namn")).toBeFocused();
  expect((await focused(page)).outline).toBe("solid");
});

test("MUPP-032-R1 a claim by tap leaves no ring on the wish list's close button", async ({ page }) => {
  await openVerasList(page);
  await region(page).getByRole("checkbox", { name: /Cykel/ }).tap();
  await region(page).getByRole("button", { name: /^Paxa \(/ }).tap();
  // fill skriver utan tangenthändelser, så det är fortfarande ett tryck som ligger närmast
  await dialog(page).getByLabel("Ditt namn").fill("Moster Lisa");
  await dialog(page).getByRole("button", { name: "Paxa" }).tap();
  await expect(dialog(page)).toHaveCount(0);
  await expect(region(page).getByRole("listitem").filter({ hasText: "Cykel" })).toContainText("Paxad");
  const { name, outline } = await focused(page);
  expect(name).toMatch(/^(Fäll ihop|Stäng) önskelistan/);
  expect(outline).toBe("none");
});
