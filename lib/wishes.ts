import type { Wish } from "./deck";

// Reglerna för önskeraderna på barnkortet (MUPP-005). Rent data in och ut, så att det går att testa utan databas.

// Först det som går att paxa, sedan det som kan köpas flera gånger, sist det som är paxat; inom en grupp gäller ordningen
// från adminsidan (sorteringen är stabil)
const group = (wish: Wish) => (wish.claimedBy !== null ? 2 : wish.unlimited ? 1 : 0);
export const sortWishes = (wishes: Wish[]) => [...wishes].sort((a, b) => group(a) - group(b));

// En önskan kan paxas om ingen har paxat den och den inte kan köpas flera gånger
export const canClaim = (wish: Wish) => wish.claimedBy === null && !wish.unlimited;
export const canUnclaim = (wish: Wish) => wish.claimedBy !== null && !wish.unlimited;

// Bara http: och https: blir länkar; allt annat (javascript:, data:, trasiga adresser) visas inte som länk
export function webLink(url: string) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// En titel över det här antalet tecken får mindre text i raden (MUPP-023); CSS kan inte veta om en titel radbröts
const LONG_TITLE = 24;
export const isLongTitle = (title: string) => title.length > LONG_TITLE;
