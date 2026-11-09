"use client";

import { useId, useState } from "react";
import { IconButton } from "@/app/components/Button";
import { ChevronDownIcon } from "@/app/components/icons";
import { SlimCard } from "@/app/components/SlimCard";
import type { ArchiveGroup } from "@/lib/family";
import { CopyItem } from "./CopyItem";

// Ett tillfälle i arkivet (MUPP-031-R5): raden fäller ut de arkiverade önskningarna under sig, pilen pekar upp när den är utfälld.
export function ArchiveGroupCard({ group }: { group: ArchiveGroup }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <SlimCard
      title={group.name}
      actions={
        <IconButton compact label={`Visa ${group.name}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className={open ? "[&_svg]:rotate-180" : ""}>
          <ChevronDownIcon />
        </IconButton>
      }
    >
      {open && (
        <ul id={id} className="mt-3 space-y-2">
          {group.items.map((item) => (
            <li key={item.id}>
              <SlimCard
                level={4}
                title={item.title}
                note={item.claimedBy ? `Paxad av ${item.claimedBy}` : item.unlimited ? "Obegränsad" : undefined}
                actions={<CopyItem itemId={item.id} title={item.title} />}
              />
            </li>
          ))}
        </ul>
      )}
    </SlimCard>
  );
}
