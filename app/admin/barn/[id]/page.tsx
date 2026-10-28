import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/app/components/Avatar";
import { LinkButton } from "@/app/components/Button";
import { FoldGroup, FoldPanel, FoldToggle } from "@/app/components/Fold";
import { Field, Form } from "@/app/components/Form";
import { PencilIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { canManage, findChild, listWishlists, type Child } from "@/lib/family";
import { OCCASIONS, parseId } from "@/lib/form-input";
import { requireSiteSession } from "@/lib/site-auth";
import { saveSizes } from "../../actions";
import { WishlistSection } from "./WishlistSection";

export default function ChildPage({ params, searchParams }: PageProps<"/admin/barn/[id]">) {
  return (
    <Suspense fallback={null}>
      <ChildContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChildContent({ params, searchParams }: Pick<PageProps<"/admin/barn/[id]">, "params" | "searchParams">) {
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
        <FoldGroup initialOpen={(await searchParams).oppna === "storlekar" ? "storlekar" : undefined}>
          <div className="space-y-4">
            <LinkButton href="/admin">Till barnen</LinkButton>
            <div className="flex items-center gap-3">
              <Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} size={40} decorative />
              <Heading level={1} small>
                {child.name}
              </Heading>
            </div>
            <SizesCard child={child} />
            {OCCASIONS.map((occasion) => (
              <WishlistSection key={occasion} child={child} occasion={occasion} items={lists[occasion]} />
            ))}
          </div>
        </FoldGroup>
      </PageContent>
    </Page>
  );
}

// Storlekarna är ett eget kort, hopfällt tills det väljs (MUPP-010-R5). keepOpen: "Sparat." ska läsas upp.
function SizesCard({ child }: { child: Child }) {
  return (
    <SlimCard
      level={2}
      title="Storlekar"
      actions={
        <FoldToggle id="storlekar" label="Ändra storlekar">
          <PencilIcon />
        </FoldToggle>
      }
    >
      <FoldPanel id="storlekar">
        <Form action={saveSizes} submit="Spara" keepOpen>
          <input type="hidden" name="childId" value={child.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="clothes" label="Kläder" defaultValue={child.sizes.clothes} maxLength={40} />
            <Field name="shoes" label="Skor" defaultValue={child.sizes.shoes} maxLength={40} />
            <Field name="head" label="Huvud" defaultValue={child.sizes.head} maxLength={40} />
            <Field name="gloves" label="Handskar" defaultValue={child.sizes.gloves} maxLength={40} />
          </div>
        </Form>
      </FoldPanel>
    </SlimCard>
  );
}
