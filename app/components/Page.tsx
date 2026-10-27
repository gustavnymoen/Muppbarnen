import type { ReactNode } from "react";

// Sidans skal: fyller skärmen (dvh, med skydd för skärmbrunn och hemfält),
// sidan själv scrollar inte, bara innehållsytan gör det.
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col overflow-hidden px-4 sm:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

export function PageContent({ children }: { children: ReactNode }) {
  // Innehållsytan scrollar och klipper det som ritas utanför den: marginal och
  // lika stor luft inuti ger plats åt fokusring och skuggor utan att flytta innehållet
  return <main className="-mx-3 -mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-3">{children}</main>;
}

export function Heading({ level = 2, children }: { level?: 1 | 2 | 3; children: ReactNode }) {
  const Tag = `h${level}` as const;
  const size = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" }[level];
  return <Tag className={`font-heading font-semibold ${size}`}>{children}</Tag>;
}
