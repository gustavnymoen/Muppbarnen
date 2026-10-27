import type { ComponentProps, Ref } from "react";

const base =
  "press inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control font-heading font-medium disabled:opacity-60 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-brand px-5 text-on-brand shadow-card hover:brightness-110",
  secondary: "border border-muted/75 bg-card px-5 text-text shadow-card hover:bg-edge",
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

// Knapp med bara en ikon: label är det skärmläsaren hör
export function IconButton({ label, children, className = "", ...props }: ComponentProps<"button"> & { label: string; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`${base} w-11 border border-muted/75 bg-card text-text shadow-card hover:bg-edge ${className}`}
      {...props}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
