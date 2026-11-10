import { describe, expect, it } from "vitest";
import type { SantaEvent } from "./santa";
import { arrangeEvents } from "./santa-groups";

const event = (id: number, name: string, ownerId: number, ownerName: string): SantaEvent => ({ id, name, status: "inactive", ownerId, ownerName, members: [] });
const summary = (events: SantaEvent[], adminId: number) => arrangeEvents(events, adminId).map((a) => `${a.event.name}:${a.foldable ? (a.open ? "open" : "closed") : "fixed"}`);

describe("arrangeEvents", () => {
  it("MUPP-056-R1 one own group and nothing else is open without a fold", () => {
    expect(summary([event(1, "A", 1, "Emma")], 1)).toEqual(["A:fixed"]);
  });

  it("MUPP-056-R2 several own groups are all closed", () => {
    expect(summary([event(1, "A", 1, "Emma"), event(2, "B", 1, "Emma")], 1)).toEqual(["A:closed", "B:closed"]);
  });

  it("MUPP-056-R3 the master admin sees own groups first (one own: open), the others closed by administrator name", () => {
    const events = [event(1, "Z", 3, "Erik"), event(2, "Y", 2, "Emma"), event(3, "X", 1, "Mia")];
    expect(summary(events, 1)).toEqual(["X:open", "Y:closed", "Z:closed"]);
  });

  it("MUPP-056-R3 several own groups stay closed and before the others; no own group gives all closed", () => {
    const events = [event(1, "Z", 3, "Erik"), event(2, "A", 1, "Mia"), event(3, "B", 1, "Mia")];
    expect(summary(events, 1)).toEqual(["A:closed", "B:closed", "Z:closed"]);
    expect(summary([events[0]], 1)).toEqual(["Z:closed"]);
  });
});
