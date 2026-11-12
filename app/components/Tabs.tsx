"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type TabItem = { id: string; title: string };

// Själva raden med flikar enligt ARIA:s flikmönster (MUPP-038-R1), styrd utifrån så att rutan "Så funkar det" (MUPP-050)
// kan använda samma rad. Panelerna ritar den som anropar, med id `${base}-${id}-panel` och aria-labelledby `${base}-${id}`.
// Piltangenter, Home och End flyttar mellan flikarna; bara den valda är nåbar med Tab.
export function TabBar({ label, base, tabs, selected, onSelect }: { label: string; base: string; tabs: TabItem[]; selected: number; onSelect: (index: number) => void }) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(next);
    buttons.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-edge">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            buttons.current[index] = el;
          }}
          id={`${base}-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={index === selected}
          aria-controls={`${base}-${tab.id}-panel`}
          tabIndex={index === selected ? 0 : -1}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => move(event, index)}
          className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-3 font-heading font-medium sm:px-4 ${index === selected ? "border-brand text-text" : "border-transparent text-muted hover:text-text"}`}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}

// Alla paneler finns i sidan men bara den valda syns, så att ett formulär i en flik behåller sitt läge när man byter flik och tillbaka.
export function Tabs({ label, tabs }: { label: string; tabs: (TabItem & { content: ReactNode })[] }) {
  const base = useId();
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-4">
      <TabBar label={label} base={base} tabs={tabs} selected={selected} onSelect={setSelected} />
      {tabs.map((tab, index) => (
        <div key={tab.id} id={`${base}-${tab.id}-panel`} role="tabpanel" aria-labelledby={`${base}-${tab.id}`} hidden={index !== selected} className="space-y-5">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
