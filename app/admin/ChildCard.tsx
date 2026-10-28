import { Avatar } from "@/app/components/Avatar";
import { IconLink } from "@/app/components/Button";
import { ListIcon } from "@/app/components/icons";
import { SlimCard } from "@/app/components/SlimCard";
import { childColor } from "@/lib/child-colors";
import type { Child } from "@/lib/family";

// Ett barn som smalt kort på förälderns sida: miniatyr, namn och länken till barnets sida med
// önskelistor och storlekar. Namnet står bredvid bilden, så bilden är dekoration.
export function ChildCard({ child }: { child: Child }) {
  return (
    <SlimCard
      level={2}
      thumb={<Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} size={32} decorative />}
      title={child.name}
      actions={
        <IconLink compact href={`/admin/barn/${child.id}`} label={`Önskelistor för ${child.name}`}>
          <ListIcon />
        </IconLink>
      }
    />
  );
}
