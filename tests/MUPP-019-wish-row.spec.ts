import { expect, test, type Page } from "@playwright/test";
import { addChild, addParent, addWish, clearFamily } from "./family-db";
import { animationsDone, birthdateIn, expectNoA11yViolations, runsLocally, uniqueName } from "./helpers";

test.skip(!runsLocally, "needs the local test database");

const region = (page: Page) => page.getByRole("article").getByRole("region", { name: "Önskelista" });
const rows = (page: Page) => region(page).getByRole("listitem");
const row = (page: Page, title: string) => rows(page).filter({ hasText: title });
const infoButton = (page: Page) => region(page).getByRole("button", { name: "Kan köpas flera gånger", exact: true });
const explanation = "Den här presenten kan köpas flera gånger, så den går inte att paxa.";

test.beforeEach(clearFamily);
test.afterAll(clearFamily);

async function openList(page: Page) {
  const vera = await addChild(await addParent(uniqueName("Förälder")), "Vera", birthdateIn(20).birthdate);
  await addWish(vera, "birthday", "Hoppborg", { claimedBy: "Moster Lisa" });
  await addWish(vera, "birthday", "Strumpor", { unlimited: true });
  await addWish(vera, "birthday", "Cykel", { description: "Röd,\nmed korg", size: "20 tum" });
  await addWish(vera, "birthday", "Pussel");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.getByRole("article").getByRole("button", { name: /^Önskelista/ }).click();
  await expect(region(page)).toBeVisible();
  // Listan glider upp när den öppnas (MUPP-016); mät först när den är i vila
  await animationsDone(region(page));
}

test("MUPP-019-R1 the info button shows and hides the explanation, and the row does not move", async ({ page }) => {
  await openList(page);
  await expect(row(page, "Strumpor")).toContainText("Kan köpas flera gånger");
  await expect(row(page, "Strumpor").getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText(explanation)).toHaveCount(0);

  // The scroll may move with the bubble, so the distance between two rows is what must stay
  const gap = async () => (await rows(page).nth(3).boundingBox())!.y - (await rows(page).nth(2).boundingBox())!.y;
  const before = await gap();
  await infoButton(page).click();
  await expect(infoButton(page)).toHaveAttribute("aria-expanded", "true");
  await expect(region(page).getByRole("status")).toHaveText(explanation);
  expect(await gap()).toBe(before);
  await expectNoA11yViolations(page);

  await infoButton(page).click();
  await expect(page.getByText(explanation)).toHaveCount(0);

  // Escape and a press elsewhere also hide it, and with the keyboard Enter shows it
  await infoButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(explanation)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText(explanation)).toHaveCount(0);
  await infoButton(page).click();
  await region(page).getByText("Pussel").click();
  await expect(page.getByText(explanation)).toHaveCount(0);

  // The sentence is not in the unfolded details
  await row(page, "Strumpor").getByRole("button", { name: "Strumpor" }).click();
  await expect(page.getByText(explanation)).toHaveCount(0);
});

test("MUPP-019-R2 the order: claimable, then bought several times, then claimed", async ({ page }) => {
  await openList(page);
  await expect(rows(page)).toHaveCount(4);
  const titles = await rows(page).evaluateAll((items) => items.map((item) => item.querySelector("button[aria-controls]:not([aria-label])")?.textContent ?? ""));
  expect(titles.map((t) => t.replace(/Paxad|Kan köpas flera gånger/, ""))).toEqual(["Cykel", "Pussel", "Strumpor", "Hoppborg"]);
});

test("MUPP-019-R3 R4 the description has a label, and the claimed line is orange-like", async ({ page }) => {
  await openList(page);
  await row(page, "Cykel").getByRole("button", { name: "Cykel" }).click();
  const details = row(page, "Cykel");
  await expect(details).toContainText("Beskrivning: Röd,\nmed korg");
  await expect(details.locator("p", { hasText: "Beskrivning:" })).toHaveCSS("white-space", "pre-line");
  await expect(details.locator("p", { hasText: /^Beskrivning/ })).toBeVisible();
  const text = await details.innerText();
  expect(text.indexOf("Beskrivning:")).toBeLessThan(text.indexOf("Storlek: 20 tum"));

  await row(page, "Pussel").getByRole("button", { name: "Pussel" }).click();
  await expect(row(page, "Pussel")).not.toContainText("Beskrivning:");

  await row(page, "Hoppborg").getByRole("button", { name: "Hoppborg" }).click();
  await expect(row(page, "Hoppborg")).toContainText("Paxad av Moster Lisa");
  await expectNoA11yViolations(page);
});
