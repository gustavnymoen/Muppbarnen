import { Avatar } from "@/app/components/Avatar";
import { IconLink } from "@/app/components/Button";
import { Field, Form } from "@/app/components/Form";
import { FormCard } from "@/app/components/FormCard";
import { ChecklistIcon, MeasureIcon } from "@/app/components/icons";
import { SlimCard } from "@/app/components/SlimCard";
import { childColor } from "@/lib/child-colors";
import type { Child } from "@/lib/family";
import { pictureUrl } from "@/lib/picture-url";
import { saveSizes } from "./actions";

// Ett barn som smalt kort på förälderns sida: miniatyr, namn, en knapp som öppnar barnets storlekar som ett formulärkort (MUPP-045)
// och en länk till sidan med barnets önskelistor. På bred skärm står en kort text bredvid ikonerna. Namnet står bredvid bilden, så bilden är dekoration.
export function ChildCard({ child }: { child: Child }) {
  return (
    <SlimCard
      level={2}
      thumb={<Avatar name={child.name} color={childColor(child.id)} src={pictureUrl(child.id, child.picture)} size={32} decorative />}
      title={child.name}
      actions={
        <>
          <FormCard title={`Storlekar för ${child.name}`} label={`Storlekar för ${child.name}`} icon={<MeasureIcon />} text="Storlekar">
            <Form action={saveSizes} submit="Spara" says={`Storlekarna för ${child.name} sparades`}>
              <input type="hidden" name="childId" value={child.id} />
              <Field name="clothes" label="Kläder" defaultValue={child.sizes.clothes} maxLength={40} />
              <Field name="shoes" label="Skor" defaultValue={child.sizes.shoes} maxLength={40} />
              <Field name="head" label="Huvud" defaultValue={child.sizes.head} maxLength={40} />
              <Field name="gloves" label="Handskar" defaultValue={child.sizes.gloves} maxLength={40} />
            </Form>
          </FormCard>
          <IconLink compact href={`/admin/barn/${child.id}/onskelistor`} label={`Önskelistor för ${child.name}`} text="Önskelistor">
            <ChecklistIcon />
          </IconLink>
        </>
      }
    />
  );
}
