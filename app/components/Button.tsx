import Link from "next/link";
import type { ComponentProps, ReactNode, Ref } from "react";

const base =
  "press inline-flex items-center justify-center gap-2 font-heading font-medium disabled:opacity-60 disabled:cursor-not-allowed";
const fullSize = "min-h-11 min-w-11";
const variants = {
  primary: "bg-brand px-5 text-on-brand shadow-card hover:brightness-110",
  secondary: "border border-muted/75 bg-card px-5 text-text shadow-card hover:bg-edge",
};

type Variant = keyof typeof variants;

// Knappens utseende, för det som ser ut som en knapp men inte är en <button> (länkar, <summary>)
const buttonClass = (variant: Variant = "primary") => `${base} rounded-control ${fullSize} ${variants[variant]}`;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${buttonClass(variant)} ${className}`} {...props} />;
}

// En länk som ser ut som en knapp
export function LinkButton({ variant = "secondary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonClass(variant)} ${className}`} {...props} />;
}

// Ikonknappar. Standard är 44 × 44 px (MUPP-001-R4); compact är 32 × 32 px (MUPP-010-R2) för
// raderna i adminens kort, där många knappar ska få plats bredvid varandra. round gör den till en cirkel (MUPP-028);
// hörnen sätts bara här, för att Tailwind inte lovar vilken av två motstridiga klasser som vinner.
const iconClass = (compact?: boolean, round?: boolean) =>
  `${base} ${round ? "rounded-full" : "rounded-control"} ${compact ? "size-8" : "min-h-11 w-11"} border border-muted/75 bg-card text-text shadow-card hover:bg-edge`;

// Utan ram (MUPP-027): bara ikonen, en rund ton bakom den när den hålls över eller trycks; ingen skugga och ingen rörelse
const framelessClass = "inline-flex min-h-11 w-11 items-center justify-center rounded-full text-text hover:bg-edge active:bg-edge";

// text: en kort text bredvid ikonen på bred skärm (från 640 px); på mobil räcker ikonen
type IconProps = { label: string; compact?: boolean; text?: string };

// Ikonen, och på bred skärm en kort text bredvid
function IconContent({ text, children }: { text?: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true">{children}</span>
      {text && (
        <span aria-hidden="true" className="hidden text-sm sm:inline">
          {text}
        </span>
      )}
    </>
  );
}

const withText = (text?: string) => (text ? "sm:w-auto sm:px-3" : "");

// Knapp med bara en ikon: label är det skärmläsaren hör, och syns som tooltip
export function IconButton({ label, compact, text, round, frameless, children, className = "", ...props }: ComponentProps<"button"> & IconProps & { round?: boolean; frameless?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button type="button" aria-label={label} title={label} className={`${frameless ? framelessClass : iconClass(compact, round)} ${withText(text)} ${className}`} {...props}>
      <IconContent text={text}>{children}</IconContent>
    </button>
  );
}

// En länk som ser ut som en ikonknapp
export function IconLink({ label, compact, text, children, className = "", ...props }: ComponentProps<typeof Link> & IconProps) {
  return (
    <Link aria-label={label} title={label} className={`${iconClass(compact)} ${withText(text)} ${className}`} {...props}>
      <IconContent text={text}>{children}</IconContent>
    </Link>
  );
}
