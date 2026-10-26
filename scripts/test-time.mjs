// Mäter testsviten för npm run test:time: kör enhetstesterna
// (npm run test:unit) och npm run test:local och skriver ut antalet
// tester, testernas sammanlagda tid och de fem långsammaste webbläsartesterna,
// och markerar det som går över tidsbudgeten i wiki/system/testing.md.
//
// Tiden är testernas egen tid, utan bygget av testservern, så att den går
// att jämföra mellan körningar.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEST_BUDGET_MS = 5_000;
const SUITE_BUDGET_MS = 180_000;
const UNIT_BUDGET_MS = 30_000;

const dir = mkdtempSync(join(tmpdir(), "test-time-"));
const reportFile = join(dir, "report.json");
const unitReportFile = join(dir, "unit.json");

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const mark = (over) => (over ? "  ← över budget" : "");

// Enhetstesterna först: de är snabba, och ett fel där syns direkt
let run, report, unitRun, unitReport;
try {
  unitRun = spawnSync("npm", ["run", "test:unit", "--", "--reporter=default", "--reporter=json", `--outputFile.json=${unitReportFile}`], {
    stdio: "inherit",
  });
  if (existsSync(unitReportFile)) unitReport = JSON.parse(readFileSync(unitReportFile, "utf8"));

  // Listan visar förloppet som vanligt, JSON-rapporten ger tiderna
  run = spawnSync("npm", ["run", "test:local", "--", "--reporter=list,json"], {
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile },
    stdio: "inherit",
  });
  // Ingen rapport om testservern inte gick att bygga: felet syns redan ovan
  if (existsSync(reportFile)) report = JSON.parse(readFileSync(reportFile, "utf8"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
// Fel om någon av körningarna föll eller inte gav någon status (t.ex. avbröts)
const failed = (r) => r.status !== 0;
if (!report) process.exit(1);

if (unitReport) {
  const unitMs = unitReport.testResults
    .flatMap((file) => file.assertionResults)
    .reduce((sum, test) => sum + (test.duration ?? 0), 0);
  console.log(`\nEnhetstester: ${unitReport.numPassedTests} godkända, ${unitReport.numFailedTests} underkända`);
  console.log(`Enhetstesternas tid: ${seconds(unitMs)} (budget ${seconds(UNIT_BUDGET_MS)})${mark(unitMs > UNIT_BUDGET_MS)}`);
}

// Varje test med sin titel och tid, i alla filer och describe-block
function testsIn(suite) {
  const own = suite.specs.flatMap((spec) =>
    spec.tests.map((test) => ({
      title: spec.title,
      file: spec.file,
      skipped: test.status === "skipped",
      ms: test.results.reduce((sum, result) => sum + result.duration, 0),
    })),
  );
  return [...own, ...(suite.suites ?? []).flatMap(testsIn)];
}

const ran = report.suites.flatMap(testsIn).filter((test) => !test.skipped);
const totalMs = ran.reduce((sum, test) => sum + test.ms, 0);
const slowest = [...ran].sort((a, b) => b.ms - a.ms).slice(0, 5);
const overBudget = ran.filter((test) => test.ms > TEST_BUDGET_MS);

console.log(`\nWebbläsartester: ${ran.length} körda, ${report.stats.skipped} överhoppade`);
console.log(`Testernas tid: ${seconds(totalMs)} (budget ${seconds(SUITE_BUDGET_MS)})${mark(totalMs > SUITE_BUDGET_MS)}`);
console.log(`\nDe fem långsammaste (budget ${seconds(TEST_BUDGET_MS)} per test):`);
for (const test of slowest) {
  console.log(`  ${seconds(test.ms).padStart(7)}  ${test.title} (${test.file})${mark(test.ms > TEST_BUDGET_MS)}`);
}
if (overBudget.length > 0) console.log(`\n${overBudget.length} tester över budget`);

process.exit(failed(unitRun) || failed(run) ? 1 : 0);
