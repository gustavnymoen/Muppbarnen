import { expect, test } from "@playwright/test";
import { addChild, addFamily, addParent, addSantaEvent, clearFamily, clearSanta, clearTestFamilies, setParentFamilies } from "./family-db";
import { birthdateIn, expectNoA11yViolations, goto, pageAnimationsDone, runsLocally, settledBox, uniqueName } from "./helpers";
import { testIp } from "./site-session";

// The tests make their data straight in the local test database (never the user's own) and remove it again
test.skip(!runsLocally, "the family tests need the local test server (its own database and passwords)");

test.beforeEach(async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ "x-real-ip": testIp() });
  await clearFamily();
});
test.afterEach(async () => {
  await clearSanta();
  await clearFamily();
  await clearTestFamilies();
});

test("MUPP-080-R1 R2 R3 R4 R5 R6 a visitor is asked to choose, sees only the chosen families, keeps the choice, changes it and takes Alla", async ({ page }) => {
  // Two families with a parent and a child each, and one Secret Santa each (a parent in both families is covered by the unit test)
  const [nameX, nameY] = [uniqueName("Ek"), uniqueName("Ask")];
  const [famX, famY] = [await addFamily(nameX, "Mormors sida"), await addFamily(nameY, "Morfars sida")];
  const [parentX, parentY] = [await addParent(uniqueName("PX")), await addParent(uniqueName("PY"))];
  await setParentFamilies(parentX, famX);
  await setParentFamilies(parentY, famY);
  const [kidX, kidY] = [uniqueName("Kx"), uniqueName("Ky")];
  await addChild(parentX, kidX, birthdateIn(10).birthdate);
  await addChild(parentY, kidY, birthdateIn(20).birthdate);
  const [santaX, santaY] = [uniqueName("JulX"), uniqueName("JulY")];
  await addSantaEvent(santaX, parentX, "inactive", null, famX);
  await addSantaEvent(santaY, parentY, "inactive", null, famY);

  // R2: no choice yet: a card asks for one, on both pages, and no child or Secret Santa is shown
  await page.setViewportSize({ width: 375, height: 667 });
  await goto(page, "/");
  await expect(page.getByRole("heading", { level: 2, name: "Vilken familj tillhör du?" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expectNoA11yViolations(page);
  // The look: the card is no wider than a child card, fits the screen and has rows of 44 px
  const askBox = await settledBox(page.getByRole("region", { name: "Vilken familj tillhör du?" }));
  expect(askBox.x).toBeGreaterThanOrEqual(0);
  expect(askBox.x + askBox.width).toBeLessThanOrEqual(375);
  expect(askBox.width).toBeLessThanOrEqual(448);
  for (const row of await page.getByRole("region", { name: "Vilken familj tillhör du?" }).getByRole("checkbox").all()) expect((await row.locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await goto(page, "/secret-santa");
  await expect(page.getByRole("heading", { level: 2, name: "Vilken familj tillhör du?" })).toBeVisible();
  await expect(page.getByRole("link", { name: santaX })).toHaveCount(0);

  // R1: the card itself lists Alla and every family with its description; nothing ticked is refused
  const card = page.getByRole("region", { name: "Vilken familj tillhör du?" });
  await expect(card.getByText("Mormors sida")).toBeVisible();
  await expect(card.getByRole("checkbox", { name: /^Alla/ })).not.toBeChecked();
  await card.getByRole("button", { name: "Spara" }).click();
  await expect(card.getByText("Välj minst en familj, eller Alla.")).toBeVisible();
  await expectNoA11yViolations(page);

  // R4: after choosing the first family only its Secret Santa is listed, also though it is the only one: it has to be clicked
  await card.getByRole("checkbox", { name: new RegExp(`^${nameX}`) }).check();
  await card.getByRole("button", { name: "Spara" }).click();
  const button = page.getByRole("button", { name: /^Familj: / });
  await expect(button).toBeVisible();
  await expect(page.getByRole("link", { name: santaX })).toBeVisible();
  await expect(page.getByRole("link", { name: santaY })).toHaveCount(0);
  await expect(page.getByText("Vilken Secret Santa är du med i?")).toBeVisible();
  // The look: the button is a 44 px icon in the top left corner, clear of the menu button, and nothing scrolls sideways
  const [buttonBox, menuBox] = [await settledBox(button), await settledBox(page.getByRole("button", { name: "Meny" }))];
  expect(buttonBox.width).toBeGreaterThanOrEqual(44);
  expect(buttonBox.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox.x).toBeLessThanOrEqual(24);
  expect(buttonBox.y).toBeLessThanOrEqual(24);
  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(menuBox.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // R3: the start page shows that family's children
  await goto(page, "/");
  await expect(page.getByRole("article")).toBeVisible();
  const body = page.locator("body");
  await expect(body).toContainText(kidX);
  await expect(body).not.toContainText(kidY);

  // R6: the choice stays (the page was loaded again above), and changing it at the top left changes both pages
  await page.getByRole("button", { name: /^Familj: / }).click();
  const change = page.getByRole("dialog", { name: "Vilken familj tillhör du?" });
  await expect(change.getByRole("checkbox", { name: new RegExp(`^${nameX}`) })).toBeChecked();
  await change.getByRole("checkbox", { name: new RegExp(`^${nameX}`) }).uncheck();
  await change.getByRole("checkbox", { name: new RegExp(`^${nameY}`) }).check();
  await expectNoA11yViolations(page);
  await change.getByRole("button", { name: "Spara" }).click();
  await expect(change).toBeHidden();
  await expect(body).toContainText(kidY);
  await expect(body).not.toContainText(kidX);
  await goto(page, "/secret-santa");
  await expect(page.getByRole("link", { name: santaY })).toBeVisible();
  await expect(page.getByRole("link", { name: santaX })).toHaveCount(0);

  // R1: Alla is no filter, and unticks the families
  await page.getByRole("button", { name: /^Familj: / }).click();
  const all = page.getByRole("dialog", { name: "Vilken familj tillhör du?" });
  await all.getByRole("checkbox", { name: /^Alla/ }).check();
  await expect(all.getByRole("checkbox", { name: new RegExp(`^${nameY}`) })).not.toBeChecked();
  await all.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByRole("button", { name: "Familj: Alla" })).toBeVisible();
  await expect(page.getByRole("link", { name: santaX })).toBeVisible();
  await expect(page.getByRole("link", { name: santaY })).toBeVisible();

  // The button stays in sight above the dimmed page, and a press on it closes the dialog again
  await page.getByRole("button", { name: /^Familj: / }).click();
  const open = page.getByRole("dialog", { name: "Vilken familj tillhör du?" });
  await expect(open).toBeVisible();
  await pageAnimationsDone(page);
  const at = (await page.getByRole("button", { name: /^Familj: / }).boundingBox())!;
  await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
  await expect(open).toBeHidden();
});
