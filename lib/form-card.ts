// Det som formulärkorten (MUPP-045) beslutar utan att behöva en webbläsare: vad som sägs när något sparats
// och vart Enter tar vägen. Komponenterna (app/components/Form.tsx, Dialog.tsx) bara använder svaret.

// Hur länge bekräftelsen efter en ny önskning står kvar (R6)
export const CONFIRMATION_MS = 3000;
// Längsta titel som får plats på bekräftelsens rad (R6)
const CONFIRMATION_TITLE = 25;

// Titeln till bekräftelsen: hela om den är högst `max` tecken, annars de första max − 1 (utan avslutande blanksteg) och "…"
export function shortTitle(title: string, max = CONFIRMATION_TITLE) {
  const text = title.trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

// Vad ett formulär säger när det sparats: en fast text ("Storlekarna för Otis sparades"), eller namnet som skrevs i ett fält
// ("Otis sparades", "fotboll lades till"). Namnet är text som skrivits av en människa och används bara som text, aldrig som HTML.
export type Said = string | { field: string; added?: boolean; short?: boolean };

export function savedMessage(says: Said, read: (field: string) => string) {
  if (typeof says === "string") return says;
  const typed = read(says.field);
  const name = (says.short ? shortTitle(typed) : typed.trim()) || "Det";
  return `${name} ${says.added ? "lades till" : "sparades"}`;
}

// Formulärets fält i ordning: textfält, textrutor, kryssrutor, filer och listornas knappar (ListPicker). Dolda fält är inga fält.
export const FIELDS = "input:not([type=hidden]), textarea, [aria-haspopup=listbox]";

// Det Enter i ett fält ska göra (R5). Fälten är formulärets fält i ordning; en lista, en kryssruta och en fil är inget Enter flyttar till eller skickar från.
export type FieldKind = "text" | "textarea" | "list" | "checkbox" | "file";
type EnterAction = { do: "default" } | { do: "focus"; index: number } | { do: "submit" };

const DEFAULT: EnterAction = { do: "default" };

// Enter i ett textfält går till nästa textfält (en textruta räknas, men listor och kryssrutor hoppas över), och i det sista skickas formuläret.
// Enter i en textruta gör en ny rad, och i en lista, kryssruta eller fil gör det som det alltid gjort. Ett ord som skrivs med inmatningsmetod (composing) rörs inte.
export function enterAction(kinds: FieldKind[], index: number, composing = false): EnterAction {
  if (composing || kinds[index] !== "text") return DEFAULT;
  const next = kinds.findIndex((kind, i) => i > index && (kind === "text" || kind === "textarea"));
  return next === -1 ? { do: "submit" } : { do: "focus", index: next };
}
