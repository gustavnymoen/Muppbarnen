import type { ComponentProps, CSSProperties, ElementType } from "react";
import type { ChildColor } from "@/lib/child-colors";

type Props = Omit<ComponentProps<"button">, "ref"> & {
  // Ett markerat kort får barnets färg på kant och skugga
  highlight?: ChildColor;
  // Kort som är länkar eller knappar flyttar sig in i skuggan när de trycks
  pressable?: boolean;
  // Ett tryckbart kort är en riktig knapp, så att tangentbord och skärmläsare fungerar
  as?: "div" | "button";
};

export function Card({ highlight, pressable, as = "div", className = "", style, ...props }: Props) {
  const Tag = as as ElementType;
  const look = highlight ? "card-highlight" : "border border-edge shadow-card";
  const tint = highlight ? ({ "--child": `var(--color-child-${highlight})` } as CSSProperties) : undefined;
  return (
    <Tag
      className={`enter block rounded-card bg-card p-4 ${look} ${pressable ? "press" : ""} ${className}`}
      style={{ ...tint, ...style }}
      {...props}
    />
  );
}
