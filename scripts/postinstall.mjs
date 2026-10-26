// Laddar ner webbläsaren som Playwright använder i testerna. Hoppas över på
// Vercels byggservrar, som inte kör testerna, och på GitHub (CI), där jobben
// körs i Playwrights image som redan har webbläsaren.
import { execSync } from 'node:child_process';

if (!process.env.VERCEL && !process.env.CI) {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
}
