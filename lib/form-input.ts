// Kontroll på servern av allt som kommer från formulär (specs/rules.md): typ,
// längd och tillåtna värden. Ren kod, så att den går att enhetstesta.

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const OCCASIONS = ["birthday", "christmas"] as const;
export type Occasion = (typeof OCCASIONS)[number];
export const OCCASION_NAMES: Record<Occasion, string> = { birthday: "Födelsedag", christmas: "Jul" };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
// Styrtecken utom radbrytning och tabb sparas aldrig
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
// Tecken räknas som i databasen (length() räknar tecken, inte byte)
const length = (text: string) => [...text].length;

export function parseText(raw: unknown, max: number, required = false): Parsed<string> {
  if (typeof raw !== "string") return fail("Fyll i det här fältet.");
  const value = raw.trim();
  if (!value) return required ? fail("Fyll i det här fältet.") : { ok: true, value };
  if (CONTROL.test(value)) return fail("Texten innehåller tecken som inte går att spara.");
  if (length(value) > max) return fail(`Högst ${max} tecken.`);
  return { ok: true, value };
}

// Ett id är ett positivt heltal skrivet med siffror, inget annat
export function parseId(raw: unknown): number | null {
  if (typeof raw !== "string" || !/^\d{1,15}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

export function parseOccasion(raw: unknown): Occasion | null {
  return OCCASIONS.find((occasion) => occasion === raw) ?? null;
}

// Ett riktigt datum, ÅÅÅÅ-MM-DD, inte i framtiden
export function parseBirthdate(raw: unknown, today = new Date()): Parsed<string> {
  const bad = fail("Skriv ett riktigt datum som inte är i framtiden.");
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return bad;
  const date = new Date(`${raw}T00:00:00Z`);
  // 31 februari blir 3 mars: datumet måste vara detsamma efter omräkningen
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return bad;
  if (raw < "1900-01-01" || raw > today.toISOString().slice(0, 10)) return bad;
  return { ok: true, value: raw };
}

// Tom länk är tillåten; annars bara http:// eller https://
export function parseLink(raw: unknown): Parsed<string> {
  const text = parseText(raw, 500);
  if (!text.ok || !text.value) return text;
  const bad = fail("Länken måste börja med http:// eller https://.");
  try {
    const { protocol } = new URL(text.value);
    return protocol === "http:" || protocol === "https:" ? text : bad;
  } catch {
    return bad;
  }
}

// Samlar kontrollerna för ett formulär: värdena, eller felen per fält
export function collect<T extends Record<string, Parsed<unknown>>>(checks: T) {
  const errors: Record<string, string> = {};
  for (const [field, result] of Object.entries(checks)) if (!result.ok) errors[field] = result.error;
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };
  const values = Object.fromEntries(Object.entries(checks).map(([field, result]) => [field, (result as { value: unknown }).value]));
  return { ok: true as const, values: values as { [K in keyof T]: T[K] extends Parsed<infer V> ? V : never } };
}
