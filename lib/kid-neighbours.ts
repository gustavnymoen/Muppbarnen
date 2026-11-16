// Barnet före och efter ett barn i listan, runt: efter det sista kommer det första (MUPP-083-R3).
// Null när det inte finns något att bläddra till (ett barn, eller barnet står inte i listan).
export function neighbours(
  ids: number[],
  id: number,
): { previous: number; next: number } | null {
  const at = ids.indexOf(id);
  if (at === -1 || ids.length < 2) return null;
  return {
    previous: ids[(at - 1 + ids.length) % ids.length],
    next: ids[(at + 1) % ids.length],
  };
}
