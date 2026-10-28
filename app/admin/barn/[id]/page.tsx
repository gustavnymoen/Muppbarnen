import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/app/components/Avatar";
import { LinkButton } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { Field, Form } from "@/app/components/Form";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { canManage, findChild, listWishlists } from "@/lib/family";
import { OCCASIONS, parseId } from "@/lib/form-input";
import { requireSiteSession } from "@/lib/site-auth";
import { saveSizes } from "../../actions";
import { WishlistSection } from "./WishlistSection";

export default function ChildPage({ params }: PageProps<"/admin/barn/[id]">) {
  return (
    <Suspense fallback={null}>
      <ChildContent params={params} />
    </Suspense>
  );
}

async function ChildContent({ params }: { params: PageProps<"/admin/barn/[id]">["params"] }) {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  const id = parseId((await params).id);
  const child = id === null ? undefined : await findChild(id);
  // Någon annans barn ser ut som ett barn som inte finns
  if (!child || !canManage(parent, child)) notFound();
  const lists = await listWishlists(child.id);

  return (
    <Page>
      <PageContent>
        <div className="space-y-6">
          <LinkButton href="/admin">Till barnen</LinkButton>
          <div className="flex items-center gap-3">
            <Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} decorative />
            <Heading level={1}>{child.name}</Heading>
          </div>
          <Card as="section" className="space-y-4">
            <Heading level={2}>Storlekar</Heading>
            <Form action={saveSizes} submit="Spara">
              <input type="hidden" name="childId" value={child.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="clothes" label="Kläder" defaultValue={child.sizes.clothes} maxLength={40} />
                <Field name="shoes" label="Skor" defaultValue={child.sizes.shoes} maxLength={40} />
                <Field name="head" label="Huvud" defaultValue={child.sizes.head} maxLength={40} />
                <Field name="gloves" label="Handskar" defaultValue={child.sizes.gloves} maxLength={40} />
              </div>
            </Form>
          </Card>
          {OCCASIONS.map((occasion) => (
            <WishlistSection key={occasion} child={child} occasion={occasion} items={lists[occasion]} />
          ))}
        </div>
      </PageContent>
    </Page>
  );
}
