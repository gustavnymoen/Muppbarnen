import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { delayedFlag, SPINNER_DELAY_MS } from "./busy-delay";

// MUPP-072-R2
describe("delayedFlag", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("MUPP-072-R2: ingen spinner före fördröjningen, spinner efter den", () => {
    const shown: boolean[] = [];
    const flag = delayedFlag((value) => shown.push(value));
    flag.set(true);
    vi.advanceTimersByTime(SPINNER_DELAY_MS - 1);
    expect(shown).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual([true]);
  });

  test("MUPP-072-R2: en snabb åtgärd blinkar aldrig till", () => {
    const shown: boolean[] = [];
    const flag = delayedFlag((value) => shown.push(value));
    flag.set(true);
    vi.advanceTimersByTime(100);
    flag.set(false);
    vi.advanceTimersByTime(1000);
    expect(shown).toEqual([false]);
  });

  test("MUPP-072-R2: spinnern försvinner när åtgärden är klar", () => {
    const shown: boolean[] = [];
    const flag = delayedFlag((value) => shown.push(value));
    flag.set(true);
    vi.advanceTimersByTime(SPINNER_DELAY_MS);
    flag.set(false);
    expect(shown).toEqual([true, false]);
  });
});
