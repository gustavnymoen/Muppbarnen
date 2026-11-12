// CI-steget som felar när webbläsartesterna går över sina tidsgränser (TECH-019).
// Användning: node scripts/check-test-time.mjs <rapport.json> [--total-ms N] [--test-ms N]
// Rapporten är Playwrights JSON-rapport; gränserna är som standard budgeten i
// scripts/test-time-limits.mjs. CI:s dator är långsammare än utvecklarens, så
// ci.yml anger sina egna gränser (se wiki/system/testing.md).

import { readFileSync } from "node:fs";
import { checkTimes, SUITE_BUDGET_MS, TEST_BUDGET_MS } from "./test-time-limits.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? Number(args[args.indexOf(name) + 1]) : fallback);
const file = args[0];
if (!file || file.startsWith("--")) {
  console.error("Användning: node scripts/check-test-time.mjs <rapport.json> [--total-ms N] [--test-ms N]");
  process.exit(2);
}
const testMs = option("--test-ms", TEST_BUDGET_MS);
const totalMs = option("--total-ms", SUITE_BUDGET_MS);
if (!Number.isFinite(testMs) || !Number.isFinite(totalMs)) {
  console.error("--test-ms och --total-ms ska vara tal i millisekunder");
  process.exit(2);
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const result = checkTimes(JSON.parse(readFileSync(file, "utf8")), { testMs, totalMs });

console.log(`Webbläsartester: ${result.ran.length} körda, testernas tid ${seconds(result.total)} (gräns ${seconds(totalMs)})`);
console.log(`De fem långsammaste (gräns ${seconds(testMs)} per test):`);
for (const test of result.slowest) console.log(`  ${seconds(test.ms).padStart(7)}  ${test.title} (${test.file})`);
if (result.totalOver) console.error(`\nFEL: testernas tid ${seconds(result.total)} är över gränsen ${seconds(totalMs)}`);
if (result.slowTests.length > 0) {
  console.error(`\nFEL: ${result.slowTests.length} tester över gränsen ${seconds(testMs)} per test:`);
  for (const test of result.slowTests) console.error(`  ${seconds(test.ms)}  ${test.title} (${test.file})`);
}
process.exit(result.ok ? 0 : 1);
