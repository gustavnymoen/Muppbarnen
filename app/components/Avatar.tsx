import type { CSSProperties } from "react";
import type { ChildColor } from "@/lib/child-colors";

// Barnets bild, eller initialen när bild saknas, med en ring i barnets färg.
// name är barnets namn och blir tillgängligt namn, utom när namnet står bredvid
// (decorative): då är bilden bara dekoration och läses inte upp.
export function Avatar({ name, color, src, size = 56, decorative }: { name: string; color: ChildColor; src?: string; size?: number; decorative?: boolean }) {
  const ring = "ring-child rounded-full border-2 bg-card";
  const tint = { "--child": `var(--color-child-${color})` } as CSSProperties;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- barnbilder kommer från Vercel Blob
    return <img src={src} alt={decorative ? "" : name} width={size} height={size} className={`${ring} object-cover`} style={{ ...tint, width: size, height: size }} />;
  }
  return (
    <span {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })} className={`${ring} inline-flex items-center justify-center font-heading font-semibold text-text`} style={{ ...tint, width: size, height: size, fontSize: size * 0.45 }}>
      <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
    </span>
  );
}
