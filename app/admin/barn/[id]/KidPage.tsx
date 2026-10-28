import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/app/components/Avatar";
import { LinkButton } from "@/app/components/Button";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { canManage, findChild, type Child } from "@/lib/family";
import { parseId } from "@/lib/form-input";
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

  return (
    <Page>
      <PageContent>
        <div className="space-y-4">
          <LinkButton href="/admin">Till barnen</LinkButton>
          <div className="flex items-center gap-3">
            <Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} size={40} decorative />
            <Heading level={1} small>
              {child.name}
            </Heading>
          </div>
          {body}
        </div>
      </PageContent>
    </Page>
  );
}
