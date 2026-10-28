import { Avatar } from "@/app/components/Avatar";
import { LinkButton } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { Chip } from "@/app/components/Chip";
import { childColor } from "@/lib/child-colors";
import type { Child } from "@/lib/family";

const SIZE_LABELS = { clothes: "Kläder", shoes: "Skor", head: "Huvud", gloves: "Handskar" } as const;

// Ett barn med bild, namn och storlekar. Namnet står bredvid bilden, så bilden är dekoration.
export function ChildCard({ child }: { child: Child }) {
  const sizes = Object.entries(SIZE_LABELS).filter(([key]) => child.sizes[key as keyof Child["sizes"]]);
  return (
    <Card as="article" className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} decorative />
        <h2 className="font-heading text-xl font-semibold">{child.name}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.length === 0 ? (
          <p className="text-muted">Inga storlekar ännu.</p>
        ) : (
          sizes.map(([key, label]) => <Chip key={key}>{`${label}: ${child.sizes[key as keyof Child["sizes"]]}`}</Chip>)
        )}
      </div>
      <LinkButton href={`/admin/barn/${child.id}`} aria-label={`Önskelistor och storlekar, ${child.name}`} className="mt-auto">
        Önskelistor och storlekar
      </LinkButton>
    </Card>
  );
}
