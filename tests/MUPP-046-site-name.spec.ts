import { expect, test, type Page } from "@playwright/test";
import { addSantaEvent, addSantaMember, clearSanta } from "./family-db";
import { adminSignIn, expectNoA11yViolations, goto, runsLocally } from "./helpers";
import { santaSignIn } from "./santa";

const meta = (page: Page, selector: string) => page.locator(`head meta[${selector}]`);

// The head every page shares: description, Open Graph (no image), the three icons and the manifest (R2, R3)
async function expectHead(page: Page, title: string) {
  const description = "Familjens önskelistor och Secret Santa.";
  await expect(meta(page, 'name="description"')).toHaveAttribute("content", description);
  await expect(meta(page, 'property="og:title"')).toHaveAttribute("content", "Kusinportalen");
  await expect(meta(page, 'property="og:site_name"')).toHaveAttribute("content", "Kusinportalen");
  await expect(meta(page, 'property="og:description"')).toHaveAttribute("content", description);
  await expect(meta(page, 'property="og:locale"')).toHaveAttribute("content", "sv_SE");
  await expect(meta(page, 'property="og:image"')).toHaveCount(0);
  await expect(meta(page, 'name="apple-mobile-web-app-title"')).toHaveAttribute("content", "Kusinportalen");
  await expect(page.locator('head link[rel="icon"][href^="/icon.svg"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="icon"][href^="/icon.png"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="apple-touch-icon"][href^="/apple-icon.png"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page).toHaveTitle(title);
}

async function expectNoOldName(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("Muppbarnen");
}

test.describe("without the site cookie", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("MUPP-046-R1 R2 R3 the password page is called Kusinportalen, has the head, and passes axe", async ({ page }) => {
    await goto(page, "/losenord");
    await expect(page.getByRole("heading", { level: 1, name: "Kusinportalen" })).toBeVisible();
    await expectHead(page, "Kusinportalen");
    await expectNoOldName(page);
    await expectNoA11yViolations(page);
  });

  test("MUPP-046-R2 R3 R4 the icons and the manifest are public files, and nothing else is", async ({ request }) => {
    for (const [path, type] of [
      ["/icon.svg", "image/svg+xml"],
      ["/icon.png", "image/png"],
      ["/apple-icon.png", "image/png"],
      ["/manifest.webmanifest", "application/manifest+json"],
    ]) {
      for (const method of ["get", "head"] as const) {
        const response = await request[method](path, { maxRedirects: 0 });
        expect(response.status(), `${method} ${path}`).toBe(200);
        expect(response.headers()["content-type"], path).toContain(type);
      }
    }
    // The manifest as served: the name, the language and the colours (R2)
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ name: "Kusinportalen", short_name: "Kusinportalen", lang: "sv", background_color: "#0C1015", theme_color: "#0C1015" });

    // Lookalikes get what they got before: 401 for a path that is not a page, a redirect for a page
    for (const path of ["/icon.png/x", "/icons/icon.png", "/bilder/1", "/api/x"]) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(path.startsWith("/icon") ? 307 : 401);
    }
    // Other methods on a public file get 401
    expect((await request.post("/icon.png", { maxRedirects: 0 })).status()).toBe(401);
  });
});

test("MUPP-046-R1 R2 R3 every page says Kusinportalen in its title and head, and no page shows the old name", async ({ page }) => {
  test.skip(!runsLocally, "the Secret Santa page needs the local test database");
  await clearSanta();
  try {
    // The start page: the title is the bare name, the hidden h1 is the name, and axe passes
    await goto(page, "/");
    await expect(page.getByRole("heading", { level: 1, name: "Kusinportalen", includeHidden: true })).toHaveCount(1);
    await expectHead(page, "Kusinportalen");
    await expectNoOldName(page);
    await expectNoA11yViolations(page);

    // The other pages end in " | Kusinportalen", from the one title template
    await goto(page, "/design");
    await expectHead(page, "Stilguide | Kusinportalen");
    await expectNoOldName(page);
    await goto(page, "/finns-inte");
    await expect(page).toHaveTitle("Sidan finns inte | Kusinportalen");
    await expectNoOldName(page);
    await adminSignIn(page);
    await expectHead(page, "Admin | Kusinportalen");
    await expectNoOldName(page);
    await goto(page, "/secret-santa");
    await expectHead(page, "Secret Santa | Kusinportalen");
    await expectNoOldName(page);
    const member = await addSantaMember(await addSantaEvent("Familjen Test"), "Anna Testsson", "0700001111", "anna@exempel.invalid");
    await santaSignIn(page, member);
    await goto(page, "/secret-santa/min-sida");
    await expectHead(page, "Din Secret Santa-sida | Kusinportalen");
    await expectNoOldName(page);
  } finally {
    await clearSanta();
  }
});
