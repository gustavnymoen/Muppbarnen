import { IconLink } from "./Button";
import { ReturnIcon } from "./icons";

// Tillbaka till en annan sida: pilen längst till vänster i sidhuvudet, mitt emot menyn (MUPP-047, MUPP-085-R5)
export function BackLink({ href }: { href: string }) {
  return (
    <IconLink label="Tillbaka" href={href}>
      <ReturnIcon />
    </IconLink>
  );
}
