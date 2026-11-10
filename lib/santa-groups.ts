import type { SantaEvent } from "./santa";

export type ArrangedEvent = { event: SantaEvent; foldable: boolean; open: boolean };

// Ordningen och startläget för grupperna på Secret Santa-fliken (MUPP-056-R1 till R3): egna grupper först, andras sist efter
// administratörens namn. Bara en grupp och inga andra: öppen utan fällning. En egen grupp är öppen, flera egna är stängda, andras alltid stängda.
export function arrangeEvents(events: SantaEvent[], adminId: number): ArrangedEvent[] {
  if (events.length === 1 && events[0].ownerId === adminId) return [{ event: events[0], foldable: false, open: true }];
  const own = events.filter((e) => e.ownerId === adminId);
  const others = events.filter((e) => e.ownerId !== adminId).sort((a, b) => a.ownerName.localeCompare(b.ownerName, "sv") || a.name.localeCompare(b.name, "sv"));
  return [...own.map((event) => ({ event, foldable: true, open: own.length === 1 })), ...others.map((event) => ({ event, foldable: true, open: false }))];
}
