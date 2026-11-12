// Tidsgränserna för webbläsartesterna och kontrollen av dem (TECH-019).
// Delas av npm run test:time (scripts/test-time.mjs, lokalt) och av CI-steget
// scripts/check-test-time.mjs, som felar när en gräns passeras.

export const TEST_BUDGET_MS = 8_000;
export const SUITE_BUDGET_MS = 330_000;

// Varje test med sin titel och tid, i alla filer och describe-block i Playwrights JSON-rapport
export function testsIn(suite) {
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

// Jämför rapportens körda tester med gränserna. Överhoppade tester räknas inte.
export function checkTimes(report, { testMs = TEST_BUDGET_MS, totalMs = SUITE_BUDGET_MS } = {}) {
  const ran = report.suites.flatMap(testsIn).filter((test) => !test.skipped);
  const total = ran.reduce((sum, test) => sum + test.ms, 0);
  const slowest = [...ran].sort((a, b) => b.ms - a.ms).slice(0, 5);
  const slowTests = ran.filter((test) => test.ms > testMs);
  return { ran, total, slowest, slowTests, totalOver: total > totalMs, ok: total <= totalMs && slowTests.length === 0 };
}
