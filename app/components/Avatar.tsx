import type { CSSProperties } from "react";
import type { ChildColor } from "@/lib/child-colors";

// Barnets bild, eller initialen när bild saknas, med en ring i barnets färg.
// name är barnets namn och blir tillgängligt namn.
export function Avatar({ name, color, src, size = 56 }: { name: string; color: ChildColor; src?: string; size?: number }) {
  const ring = "ring-child rounded-full border-2 bg-card";
  const tint = { "--child": `var(--color-child-${color})` } as CSSProperties;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- barnbilder kommer från Vercel Blob
    return <img src={src} alt={name} width={size} height={size} className={`${ring} object-cover`} style={{ ...tint, width: size, height: size }} />;
  }
  return (
    <span role="img" aria-label={name} className={`${ring} inline-flex items-center justify-center font-heading font-semibold text-text`} style={{ ...tint, width: size, height: size, fontSize: size * 0.45 }}>
      <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
    </span>
  );
}
