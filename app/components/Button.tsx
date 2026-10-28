import Link from "next/link";
import type { ComponentProps, Ref } from "react";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-control font-heading font-medium disabled:opacity-60 disabled:cursor-not-allowed";
const fullSize = "min-h-11 min-w-11";
const variants = {
  primary: "bg-brand px-5 text-on-brand shadow-card hover:brightness-110",
  secondary: "border border-muted/75 bg-card px-5 text-text shadow-card hover:bg-edge",
};

type Variant = keyof typeof variants;

// Knappens utseende, för det som ser ut som en knapp men inte är en <button> (länkar, <summary>)
export const buttonClass = (variant: Variant = "primary") => `${base} ${fullSize} ${variants[variant]}`;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${buttonClass(variant)} ${className}`} {...props} />;
}

// En länk som ser ut som en knapp
export function LinkButton({ variant = "secondary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonClass(variant)} ${className}`} {...props} />;
}

// Ikonknappar. Standard är 44 × 44 px (MUPP-001-R4); compact är 32 × 32 px (MUPP-010-R2) för
// raderna i adminens kort, där många knappar ska få plats bredvid varandra.
const iconClass = (compact?: boolean) =>
  `${base} ${compact ? "size-8" : "min-h-11 w-11"} border border-muted/75 bg-card text-text shadow-card hover:bg-edge`;

type IconProps = { label: string; compact?: boolean };

// Knapp med bara en ikon: label är det skärmläsaren hör, och syns som tooltip
export function IconButton({ label, compact, children, className = "", ...props }: ComponentProps<"button"> & IconProps & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button type="button" aria-label={label} title={label} className={`${iconClass(compact)} ${className}`} {...props}>
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

// En länk som ser ut som en ikonknapp
export function IconLink({ label, compact, children, className = "", ...props }: ComponentProps<typeof Link> & IconProps) {
  return (
    <Link aria-label={label} title={label} className={`${iconClass(compact)} ${className}`} {...props}>
      <span aria-hidden="true">{children}</span>
    </Link>
  );
}
