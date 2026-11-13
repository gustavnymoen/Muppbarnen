import type { ReactNode } from "react";

// Ikonerna i adminens ikonknappar. De är dekoration: knappen har det tillgängliga namnet.
function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const PencilIcon = () => (
  <Icon>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Icon>
);

export const CheckCircleIcon = () => (
  <Icon size={14}>
    <circle cx="12" cy="12" r="10" />
    <path d="m7.5 12.5 3 3 6-6.5" />
  </Icon>
);

export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);

export const ImageIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-9 9" />
  </Icon>
);

// Checklista: önskelistan
export const ChecklistIcon = () => (
  <Icon>
    <path d="m3.5 6 1.5 1.5L8 4.5M3.5 13l1.5 1.5L8 11.5" />
    <path d="M12 6h9M12 13h9M4 19.5h.01M12 19.5h9" />
  </Icon>
);

// Tomteluva: Secret Santa
export const SantaHatIcon = () => (
  <Icon>
    <path d="M6 16C6 9 9 4 14 4c2.5 0 4 1.5 4 4v8" />
    <rect x="3" y="16" width="18" height="4" rx="2" />
    <circle cx="19" cy="4" r="1.5" />
  </Icon>
);

// Pratbubbla: samtalet i Secret Santa (MUPP-043)
export const ChatIcon = () => (
  <Icon>
    <path d="M4 5h16v11H11l-5 4v-4H4V5Z" />
  </Icon>
);

// Jag och tomten: avsändaren vid varje meddelande i samtalet (MUPP-043). Alltid samma ikoner, så att de inte pekar ut någon.
export const PersonIcon = () => (
  <Icon size={24}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const TomteIcon = () => (
  <Icon size={24}>
    <path d="M6 10C6 5.5 8.5 2.5 12 2.5c3.5 0 5.5 1.5 6.5 5" />
    <circle cx="19" cy="9.5" r="1.5" />
    <path d="M5 10h13M10 12.5h.01M14 12.5h.01" />
    <path d="M6 10.5c0 5 1.5 7 3 8l3 2.5 3-2.5c1.5-1 3-3 3-8M9 15.5c1-1 2-1 3 0 1-1 2-1 3 0" />
  </Icon>
);

// Arg tomte: tjatknappen i Secret Santa (MUPP-071). Samma tomte som ovan, med sneda ögonbryn och en nedåtböjd mun.
export const AngryTomteIcon = () => (
  <Icon size={24}>
    <path d="M6 10C6 5.5 8.5 2.5 12 2.5c3.5 0 5.5 1.5 6.5 5" />
    <circle cx="19" cy="9.5" r="1.5" />
    <path d="M5 10h13M9.5 14.5h.01M14.5 14.5h.01" />
    <path d="M8 12l3 1.5M16 12l-3 1.5" />
    <path d="M6 10.5c0 5 1.5 7 3 8l3 2.5 3-2.5c1.5-1 3-3 3-8M9.5 18.5c1.5-1.2 3.5-1.2 5 0" />
  </Icon>
);

// Måttband: storlekar
export const MeasureIcon = () => (
  <Icon>
    <rect x="2" y="8" width="20" height="8" rx="1.5" />
    <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
  </Icon>
);

export const ChevronLeftIcon = () => (
  <Icon>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);

// Pil som svänger tillbaka: Tillbaka från ett barn till alla barn
export const ReturnIcon = () => (
  <Icon>
    <path d="M20 20v-7a4 4 0 0 0-4-4H4M9 14 4 9l5-5" />
  </Icon>
);

export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = () => (
  <Icon>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

// Två pilar runt en cirkel: byt förälder (MUPP-053)
export const SwapIcon = () => (
  <Icon>
    <path d="M17 3l4 4-4 4M21 7H8a4 4 0 0 0-4 4M7 21l-4-4 4-4M3 17h13a4 4 0 0 0 4-4" />
  </Icon>
);

export const CrossIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

// Ett "i" i en cirkel: förklaringen till en rad
export const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

// En pil som går runt bakåt: ångra, på den paxade raden (MUPP-006)
export const UndoIcon = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
);
