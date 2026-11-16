import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/app/components/Avatar";
import { IconLink, LinkButton } from "@/app/components/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { SizesButton } from "@/app/components/SizesButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { canManage, findChild, listChildren, type Child } from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { neighbours } from "@/lib/kid-neighbours";
import { pictureUrl } from "@/lib/picture-url";
import { requireSiteSession } from "@/lib/site-auth";

// Barnets sidor (storlekar, önskelistor) delar kontrollerna och sidhuvudet. Någon annans barn ser
// ut som ett barn som inte finns. content får barnet och ritar det som är sidans eget.
export async function KidPage({ params, content }: { params: Promise<{ id: string }>; content: (child: Child) => Promise<ReactNode> | ReactNode }) {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const id = parseId((await params).id);
  const child = id === null ? undefined : await findChild(id);
  if (!child || !canManage(parent, child)) notFound();
  const body = await content(child);
  // Pilarna går bara mellan förälderns egna barn, i samma ordning som på adminsidan (MUPP-083-R3)
  const around = parent && neighbours((await listChildren(parent.id)).map((kid) => kid.id), child.id);

  return (
    <Page>
      <PageContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <LinkButton href="/admin">Till barnen</LinkButton>
            <SizesButton kid={child} mode="corner" />
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={child.name} color={childColor(child.id)} src={pictureUrl(child.id, child.picture)} size={40} decorative />
            <Heading level={1} small>
              {child.name}
            </Heading>
          </div>
          {body}
        </div>
        {around && (
          <>
            <KidArrow side="left" kidId={around.previous} label="Föregående barn" />
            <KidArrow side="right" kidId={around.next} label="Nästa barn" />
          </>
        )}
      </PageContent>
    </Page>
  );
}

// Samma pilar som på startsidans kortlek (BirthdayDeck), mitt på höjden, men alltid vid skärmens kant (som kortlekens på en smal telefon, TECH-013-R5):
// raderna i listorna börjar och slutar så nära att pilarna annars täcker texten eller knapparna (MUPP-083-R4).
// fixed: pilarna står kvar när sidan scrollar. Att sidan bakom ett öppet kort är inert gör att pilarna då inte går att nå.
function KidArrow({ side, kidId, label }: { side: "left" | "right"; kidId: number; label: string }) {
  const edge = side === "left" ? "left-0" : "right-0";
  return (
    <div className={`pointer-events-none fixed inset-y-0 z-10 flex items-center ${edge}`}>
      <IconLink className="pointer-events-auto" href={`/admin/barn/${kidId}/onskelistor`} label={label}>
        {side === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconLink>
    </div>
  );
}
