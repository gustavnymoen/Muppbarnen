// De sex barnfärgerna (namnen är tokens i app/globals.css)
export const CHILD_COLORS = ["coral", "sun", "mint", "sky", "lilac", "pink"] as const;
export type ChildColor = (typeof CHILD_COLORS)[number];

// Ett barns färg ur barnets nummer: samma nummer ger alltid samma färg, och
// vilket tal som helst ger en färg (negativa och stora tal går varv).
export function childColor(index: number): ChildColor {
  const n = Number.isFinite(index) ? Math.trunc(index) : 0;
  const count = CHILD_COLORS.length;
  return CHILD_COLORS[((n % count) + count) % count];
}
