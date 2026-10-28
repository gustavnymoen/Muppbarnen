import { Avatar } from "@/app/components/Avatar";
import { IconLink } from "@/app/components/Button";
import { ChecklistIcon, MeasureIcon } from "@/app/components/icons";
import { SlimCard } from "@/app/components/SlimCard";
import { childColor } from "@/lib/child-colors";
import type { Child } from "@/lib/family";

// Ett barn som smalt kort på förälderns sida: miniatyr, namn och två länkar till barnets sida,
// en för storlekarna (kortet med storlekar står då öppet) och en för önskelistorna. Namnet står bredvid bilden, så bilden är dekoration.
export function ChildCard({ child }: { child: Child }) {
  return (
    <SlimCard
      level={2}
      thumb={<Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} size={32} decorative />}
      title={child.name}
      actions={
        <>
          <IconLink compact href={`/admin/barn/${child.id}?oppna=storlekar`} label={`Storlekar för ${child.name}`}>
            <MeasureIcon />
          </IconLink>
          <IconLink compact href={`/admin/barn/${child.id}`} label={`Önskelistor för ${child.name}`}>
            <ChecklistIcon />
          </IconLink>
        </>
      }
    />
  );
}
