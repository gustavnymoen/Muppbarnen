// Det samtalets sida och sida delar: typerna och gränsen, utan servernycklar (MUPP-043), så att kortet i webbläsaren kan läsa dem.
// "giver": hen skriver till den hen ska handla åt (Min matchning). "receiver": hen skriver till sin Secret Santa (Min önskelista).
export type ChatSide = "giver" | "receiver";
// Det enda som lämnar servern om ett meddelande: vem som skrev (jag eller den andra) och texten. Inget id, ingen tid, inget namn (R3).
export type ChatMessage = { mine: boolean; text: string };
export type ChatResult = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };

export const MAX_MESSAGE_LENGTH = 500;
