import { describe, expect, test } from "vitest";
import { checkTimes, testsIn } from "./test-time-limits.mjs";

// En liten Playwright-rapport: tider i ms, ett överhoppat test och ett nästlat describe-block
const spec = (title: string, ms: number, status = "expected") => ({
  title,
  file: "tests/x.spec.ts",
  tests: [{ status, results: [{ duration: ms }] }],
});
const report = (...specs: ReturnType<typeof spec>[]) => ({ suites: [{ specs: specs.slice(0, 1), suites: [{ specs: specs.slice(1) }] }] });

describe("TECH-019-R3 time limits", () => {
  test("TECH-019-R3 adds up the tests of nested suites and leaves out skipped ones", () => {
    const r = report(spec("a", 1000), spec("b", 2000), spec("c", 9000, "skipped"));
    expect(testsIn(r.suites[0]).map((t: { title: string }) => t.title)).toEqual(["a", "b", "c"]);
    const result = checkTimes(r);
    expect(result.ran).toHaveLength(2);
    expect(result.total).toBe(3000);
  });

  test("TECH-019-R3 passes when the total and every test are within the limits", () => {
    const result = checkTimes(report(spec("a", 5000), spec("b", 4000)), { testMs: 5000, totalMs: 9000 });
    expect(result.ok).toBe(true);
  });

  test("TECH-019-R3 fails and names a test over the per-test limit", () => {
    const result = checkTimes(report(spec("fast", 1000), spec("slow", 5001)), { testMs: 5000, totalMs: 100_000 });
    expect(result.ok).toBe(false);
    expect(result.slowTests.map((t: { title: string }) => t.title)).toEqual(["slow"]);
    expect(result.totalOver).toBe(false);
  });

  test("TECH-019-R3 fails when the total is over the limit", () => {
    const result = checkTimes(report(spec("a", 4000), spec("b", 4000)), { testMs: 5000, totalMs: 7999 });
    expect(result.ok).toBe(false);
    expect(result.totalOver).toBe(true);
    expect(result.slowTests).toEqual([]);
  });

  test("TECH-019-R3 sums the attempts of one test and lists the slowest first", () => {
    const retried = { title: "retried", file: "f", tests: [{ status: "expected", results: [{ duration: 3000 }, { duration: 3000 }] }] };
    const result = checkTimes({ suites: [{ specs: [retried, spec("b", 4000)] }] }, { testMs: 5000, totalMs: 100_000 });
    expect(result.slowest[0].title).toBe("retried");
    expect(result.slowTests.map((t: { title: string }) => t.title)).toEqual(["retried"]);
  });

  test("TECH-019-R3 uses the budget of testing.md by default", () => {
    // 330 s är gränsen: precis på den är godkänt, en millisekund över är det inte
    const many = Array.from({ length: 64 }, (_, i) => spec(`t${i}`, 5000));
    expect(checkTimes(report(...many, spec("a", 5000), spec("b", 5000))).ok).toBe(true);
    expect(checkTimes(report(...many, spec("a", 5000), spec("b", 4999.5), spec("c", 1))).ok).toBe(false);
  });
});
