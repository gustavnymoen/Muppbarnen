// Det en formuläråtgärd svarar med (se Form.tsx): sparat, ett fel för hela formuläret, fel per fält,
// och vid fel värdena som skrevs, så att formuläret inte töms när något ska rättas.
export type FormState = {
  saved?: boolean;
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export type FormAction = (previous: FormState, formData: FormData) => Promise<FormState>;

// Svaret för ett formulär som misslyckades. Lösenord och filer tas aldrig med.
export function failed(formData: FormData, outcome: { error?: string; fields?: Record<string, string> }): FormState {
  const values = Object.fromEntries([...formData].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  return { error: outcome.error, fields: outcome.fields, values };
}

export const saved: FormState = { saved: true };
