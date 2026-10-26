// Kontrollerar att Playwright-imagen som jobbet körs i har samma
// version som det installerade @playwright/test. Imagen skriver sin version i
// /ms-playwright/.docker-info. Skiljer de sig stoppas jobbet före testerna,
// i stället för att testerna faller på en webbläsare som saknas.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const installed = require("@playwright/test/package.json").version;
const image = JSON.parse(readFileSync("/ms-playwright/.docker-info", "utf8")).driverVersion;

if (image !== installed) {
  console.error(
    `::error::Playwright-imagen har version ${image}, men @playwright/test är ${installed}. ` +
      `Ändra imagen till mcr.microsoft.com/playwright:v${installed}-noble i ` +
      `.github/workflows/ci.yml, preview-tests.yml och live-tests.yml.`,
  );
  process.exit(1);
}
console.log(`Playwright ${installed}, samma i imagen och i package-lock.json`);
