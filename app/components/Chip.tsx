import type { CSSProperties, ReactNode } from "react";
import type { ChildColor } from "@/lib/child-colors";

// En etikett: texten bär alltid budskapet, färgen är bara en detalj
export function Chip({ color, children }: { color?: ChildColor; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold ${color ? "chip-child" : "border border-edge text-text"}`}
      style={color ? ({ "--child": `var(--color-child-${color})` } as CSSProperties) : undefined}
    >
      {children}
    </span>
  );
}
