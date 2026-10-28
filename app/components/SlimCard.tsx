import type { ReactNode } from "react";
import { Heading } from "./Page";

// Ett smalt kort i adminen (MUPP-010-R1): en rad med miniatyr, namn och ikonknappar. Det som fälls
// ut (FoldPanel) kommer som children, under raden. Raden är cirka 50 px hög.
export function SlimCard({
  thumb,
  title,
  note,
  level = 3,
  actions,
  children,
}: {
  thumb?: ReactNode;
  title: string;
  note?: string;
  level?: 2 | 3;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-control border border-edge bg-card px-3 py-1.5">
      <div className="flex items-center gap-2">
        {thumb}
        <div className="min-w-0 flex-1 break-words">
          <Heading level={level} small>
            {title}
          </Heading>
          {note && <span className="block text-sm leading-4 text-muted">{note}</span>}
        </div>
        <div className="flex shrink-0 gap-2">{actions}</div>
      </div>
      {children}
    </article>
  );
}
