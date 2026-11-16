import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/app/components/Avatar";
import { BackLink } from "@/app/components/BackLink";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { canManage, findChild, listChildren, type Child } from "@/lib/family";
import { parseId } from "@/lib/form-input";
import { pictureUrl } from "@/lib/picture-url";
import { requireSiteSession } from "@/lib/site-auth";
import { KidFlipper } from "./KidFlipper";

// Barnets önskelistsida: kontrollerna och sidhuvudet. Någon annans barn ser ut som ett barn som inte finns.
// content får barnet och ritar det som är sidans eget. Förälderns alla barn ritas på en gång (MUPP-085-R2), så att
// bläddringen mellan dem inte behöver ladda något; ett barn som inte står i förälderns lista (en huvudadministratör på någon annans barn) ritas ensamt.
export async function KidPage({ params, content }: { params: Promise<{ id: string }>; content: (child: Child) => Promise<ReactNode> | ReactNode }) {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const id = parseId((await params).id);
  const child = id === null ? undefined : await findChild(id);
  if (!child || !canManage(parent, child)) notFound();
  const own = parent ? await listChildren(parent.id) : [];
  const kids = own.some((kid) => kid.id === child.id) ? own : [child];
  const panels = await Promise.all(
    kids.map(async (kid) => ({
      id: kid.id,
      node: (
        <div className="space-y-4">
          <div className="flex min-h-11 items-center gap-3">
            <Avatar name={kid.name} color={childColor(kid.id)} src={pictureUrl(kid.id, kid.picture)} size={40} decorative />
            <Heading level={1} small>
              <span tabIndex={-1} className="outline-none">{kid.name}</span>
            </Heading>
          </div>
          {await content(kid)}
        </div>
      ),
    })),
  );

  return (
    <Page back={<BackLink href="/admin" />}>
      <PageContent>
        <KidFlipper panels={panels} firstId={child.id} />
      </PageContent>
    </Page>
  );
}
