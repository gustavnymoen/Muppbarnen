import type { ReactNode } from "react";

// Ikonerna i adminens ikonknappar. De är dekoration: knappen har det tillgängliga namnet.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
