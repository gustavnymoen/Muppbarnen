// Dragningen (MUPP-041-R3): ren logik utan databas, så att den går att provköra tusentals gånger. Varje deltagare ger till
// exakt en och får av exakt en, aldrig sig själv, aldrig sin partner och aldrig den hen hade förra året. Går det inte släpps
// förra årets regel först, sedan partnerregeln; regeln om en själv släpps aldrig.

export type Drawable = { id: number; partnerId: number | null };
export type SetAside = "lastYear" | "partner";
export type DrawResult = { ok: true; pairs: Map<number, number>; setAside: SetAside[] } | { ok: false };

// Slumptal ur plattformens säkra generator (0 ≤ n < max); modulo-snedheten är försumbar för max under 100
const secureInt = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// lastYear: givare → mottagare förra året
export function drawPairs(members: Drawable[], lastYear: Map<number, number>): DrawResult {
  if (members.length < 2) return { ok: false };
  const levels: { setAside: SetAside[]; lastYear: boolean; partner: boolean }[] = [
    { setAside: [], lastYear: true, partner: true },
    { setAside: ["lastYear"], lastYear: false, partner: true },
    { setAside: ["lastYear", "partner"], lastYear: false, partner: false },
  ];
  for (const level of levels) {
    const allowed = (giver: Drawable, receiverId: number) =>
      receiverId !== giver.id && !(level.partner && giver.partnerId === receiverId) && !(level.lastYear && lastYear.get(giver.id) === receiverId);
    const pairs = matching(members, allowed);
    if (pairs) return { ok: true, pairs, setAside: level.setAside };
  }
  return { ok: false };
}

// Slumpade försök först (nästan alltid tillräckligt); sedan en uttömmande sökning, som också säger att det är omöjligt
// shortcut: parning med utökande vägar är inte likformigt slumpad, men används bara när de slumpade försöken inte lyckas
function matching(members: Drawable[], allowed: (giver: Drawable, receiverId: number) => boolean): Map<number, number> | null {
  const ids = members.map((m) => m.id);
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = shuffled(ids);
    if (members.every((giver, i) => allowed(giver, order[i]))) return new Map(members.map((giver, i) => [giver.id, order[i]]));
  }
  const taken = new Map<number, Drawable>(); // mottagare → givare
  const place = (giver: Drawable, seen: Set<number>): boolean => {
    for (const receiverId of shuffled(ids)) {
      if (!allowed(giver, receiverId) || seen.has(receiverId)) continue;
      seen.add(receiverId);
      const holder = taken.get(receiverId);
      if (!holder || place(holder, seen)) {
        taken.set(receiverId, giver);
        return true;
      }
    }
    return false;
  };
  if (!shuffled(members).every((giver) => place(giver, new Set()))) return null;
  return new Map([...taken].map(([receiverId, giver]) => [giver.id, receiverId]));
}
