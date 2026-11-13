"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { delayedFlag } from "@/lib/busy-delay";

const base =
  "press inline-flex items-center justify-center gap-2 font-heading font-medium disabled:opacity-60 disabled:cursor-not-allowed aria-busy:disabled:opacity-90 aria-busy:disabled:cursor-progress";
const fullSize = "min-h-11 min-w-11";
const variants = {
  primary: "bg-brand px-5 text-on-brand shadow-card hover:brightness-110",
  secondary: "border border-muted/75 bg-card px-5 text-text shadow-card hover:bg-edge",
  // Röd ram och röd text (MUPP-071): tjatknappen i Secret Santa
  red: "border border-christmas-red bg-card px-5 text-christmas-red shadow-card hover:bg-edge",
};

type Variant = keyof typeof variants;

// Knappens utseende, för det som ser ut som en knapp men inte är en <button> (länkar, <summary>)
const buttonClass = (variant: Variant = "primary") => `${base} rounded-control ${fullSize} ${variants[variant]}`;

// Upptagen knapp (MUPP-072): låst direkt, spinner först efter en kort stund. Spinnern är gömd för skärmläsare;
// den hör en statustext i stället. Statustexten ligger bredvid knappen, inte i den, så att knappens namn inte ändras.
function useBusy(busy?: boolean) {
  const [spinner, setSpinner] = useState(false);
  useEffect(() => {
    const flag = delayedFlag(setSpinner);
    flag.set(!!busy);
    return () => flag.set(false);
  }, [busy]);
  return spinner;
}

function Spinner() {
  return <span aria-hidden="true" className="spinner" />;
}

// Spinnern (12 px) och glappet (8 px) tar 20 px; lika mycket tas från sidomarginalen (20 px till 10 px) medan spinnern visas, så knappen behåller sin storlek (MUPP-072-R1)
const spinnerRoom = "data-spinner:px-2.5";

// Finns bara medan knappen är upptagen (tom först, så att regionen redan finns när texten kommer). fixed i stället för sr-onlys absolute: en absolut dold text längst ner kan annars ge sidan en egen scroll
const Status = ({ busy, shown }: { busy?: boolean; shown: boolean }) =>
  busy && (
    <span role="status" className="sr-only" style={{ position: "fixed" }}>
      {shown ? "Arbetar …" : ""}
    </span>
  );

export function Button({ variant = "primary", busy, className = "", children, disabled, ...props }: ComponentProps<"button"> & { variant?: Variant; busy?: boolean }) {
  const spinner = useBusy(busy);
  return (
    <>
      <button type="button" className={`${buttonClass(variant)} ${spinnerRoom} ${className}`} data-spinner={spinner || undefined} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
        {spinner && <Spinner />}
        {children}
      </button>
      <Status busy={busy} shown={spinner} />
    </>
  );
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
export function IconButton({ label, compact, text, round, frameless, busy, children, className = "", disabled, ...props }: ComponentProps<"button"> & IconProps & { round?: boolean; frameless?: boolean; busy?: boolean; ref?: Ref<HTMLButtonElement> }) {
  const spinner = useBusy(busy);
  return (
    <>
      <button type="button" aria-label={label} title={label} className={`${frameless ? framelessClass : iconClass(compact, round)} ${withText(text)} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
        {spinner ? <Spinner /> : <IconContent text={text}>{children}</IconContent>}
      </button>
      <Status busy={busy} shown={spinner} />
    </>
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
