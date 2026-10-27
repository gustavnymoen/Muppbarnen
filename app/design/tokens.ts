import { CHILD_COLORS } from "@/lib/child-colors";

// Färgerna som stilguiden visar, med klassnamn. Värdena är desamma som i
// app/globals.css; lib/design-tokens.test.ts kontrollerar att de stämmer.
export const swatches = [
  { name: "Sidbakgrund", token: "page", hex: "#0C1015", className: "bg-page" },
  { name: "Kort", token: "card", hex: "#141920", className: "bg-card" },
  { name: "Kortkant", token: "edge", hex: "#272E39", className: "bg-edge" },
  { name: "Skugga", token: "shadow", hex: "#05080D", className: "bg-shadow" },
  { name: "Text", token: "text", hex: "#C8D0DC", className: "bg-text" },
  { name: "Dämpad text", token: "muted", hex: "#8591A4", className: "bg-muted" },
  { name: "Märkesfärg", token: "brand", hex: "#9AA9E0", className: "bg-brand" },
  { name: "Fel", token: "danger", hex: "#E8938F", className: "bg-danger" },
] as const;

export const childSwatches = CHILD_COLORS.map((color, i) => ({ color, name: ["Korall", "Sol", "Mynta", "Himmel", "Lila", "Rosa"][i] }));

export const hexOf = (token: string) => swatches.find((s) => s.token === token)!.hex;
