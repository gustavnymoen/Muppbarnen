import type { Wish } from "./deck";

// Reglerna för önskeraderna på barnkortet (MUPP-005). Rent data in och ut, så att det går att testa utan databas.

// Paxade önskningar sist; övriga behåller ordningen från adminsidan (sorteringen är stabil)
export const sortWishes = (wishes: Wish[]) => [...wishes].sort((a, b) => Number(a.claimedBy !== null) - Number(b.claimedBy !== null));

// En önskan kan paxas om ingen har paxat den och den inte kan köpas flera gånger
export const canClaim = (wish: Wish) => wish.claimedBy === null && !wish.unlimited;

// Bara http: och https: blir länkar; allt annat (javascript:, data:, trasiga adresser) visas inte som länk
export function webLink(url: string) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
