import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/app/components/Avatar";
import { LinkButton } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { Disclosure } from "@/app/components/Disclosure";
import { Field, Form } from "@/app/components/Form";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { listChildren, listParents, type Child, type Parent } from "@/lib/family";
import { requireSiteSession } from "@/lib/site-auth";
import { removeChild, removeParent, saveChild, saveChildPicture, saveParent } from "../actions";

// Bara huvudadministratören. För andra ser sidan ut som en sida som inte finns.
export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageContent />
    </Suspense>
  );
}

async function ManageContent() {
  await requireSiteSession();
  const { parent } = await requireAdminSession();
  if (!parent?.isMasterAdmin) notFound();
  const [parents, children] = await Promise.all([listParents(), listChildren()]);

  return (
    <Page>
      <PageContent>
        <div className="space-y-6">
          <LinkButton href="/admin">Till barnen</LinkButton>
          <Heading level={1}>Hantera</Heading>
          <Card as="section" className="space-y-4">
            <Heading level={2}>Föräldrar</Heading>
            <ul className="space-y-4">
              {parents.map((p) => (
                <li key={p.id}>
                  <ParentRow parent={p} />
                </li>
              ))}
            </ul>
            <Disclosure label="Ny förälder">
              <ParentForm submit="Lägg till" />
            </Disclosure>
          </Card>
          <Card as="section" className="space-y-4">
            <Heading level={2}>Barn</Heading>
            {children.length === 0 && <p className="text-muted">Inga barn ännu.</p>}
            <ul className="space-y-4">
              {children.map((child) => (
                <li key={child.id}>
                  <ChildRow child={child} parents={parents} />
                </li>
              ))}
            </ul>
            <Disclosure label="Nytt barn">
              <ChildForm parents={parents} submit="Lägg till" />
            </Disclosure>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}

function ParentRow({ parent }: { parent: Parent }) {
  return (
    <article className="space-y-3 rounded-control border border-edge p-4">
      <Heading level={3}>{parent.name}</Heading>
      {parent.isMasterAdmin && <p className="text-muted">Huvudadministratör</p>}
      <div className="flex flex-wrap gap-3">
        <Disclosure label="Ändra" subject={parent.name}>
          <ParentForm parent={parent} submit="Spara" />
        </Disclosure>
        <ConfirmAction
          action={removeParent}
          fields={{ parentId: String(parent.id) }}
          label="Ta bort"
          subject={parent.name}
          title={`Ta bort ${parent.name}?`}
          text={`${parent.name} tas bort. Det går bara om föräldern inte har några barn.`}
        />
      </div>
    </article>
  );
}

function ParentForm({ parent, submit }: { parent?: Parent; submit: string }) {
  return (
    <Form action={saveParent} submit={submit}>
      {parent && <input type="hidden" name="parentId" value={parent.id} />}
      <Field name="name" label="Namn" defaultValue={parent?.name} maxLength={60} required />
      <Field name="isMasterAdmin" type="checkbox" label="Huvudadministratör" defaultChecked={parent?.isMasterAdmin} hint="Får skapa och ändra föräldrar, barn och bilder." />
    </Form>
  );
}

function ChildRow({ child, parents }: { child: Child; parents: Parent[] }) {
  const owner = parents.find((p) => p.id === child.parentId);
  return (
    <article className="space-y-3 rounded-control border border-edge p-4">
      <div className="flex items-center gap-3">
        <Avatar name={child.name} color={childColor(child.id)} src={child.picture ? `/bilder/${child.id}` : undefined} decorative />
        <div>
          <Heading level={3}>{child.name}</Heading>
          <p className="text-muted">
            Född {child.birthdate}, förälder: {owner?.name}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <LinkButton href={`/admin/barn/${child.id}`} aria-label={`Önskelistor och storlekar, ${child.name}`}>
          Önskelistor och storlekar
        </LinkButton>
        <Disclosure label="Ändra" subject={child.name}>
          <ChildForm child={child} parents={parents} submit="Spara" />
        </Disclosure>
        <Disclosure label="Bild" subject={child.name}>
          <Form action={saveChildPicture} submit="Spara bild">
            <input type="hidden" name="childId" value={child.id} />
            <Field name="picture" type="file" label="Bild" accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG eller WebP, högst 4 MB." required />
          </Form>
        </Disclosure>
        <ConfirmAction
          action={removeChild}
          fields={{ childId: String(child.id) }}
          label="Ta bort"
          subject={child.name}
          title={`Ta bort ${child.name}?`}
          text={`${child.name}, barnets önskelistor och bild tas bort. Det går inte att ångra.`}
        />
      </div>
    </article>
  );
}

function ChildForm({ child, parents, submit }: { child?: Child; parents: Parent[]; submit: string }) {
  return (
    <Form action={saveChild} submit={submit}>
      {child && <input type="hidden" name="childId" value={child.id} />}
      <Field name="name" label="Namn" defaultValue={child?.name} maxLength={60} required />
      <Field name="birthdate" type="date" label="Födelsedatum" defaultValue={child?.birthdate} required />
      <Field
        name="parentId"
        type="select"
        label="Förälder"
        defaultValue={child ? String(child.parentId) : undefined}
        options={parents.map((p) => ({ value: String(p.id), label: p.name }))}
      />
    </Form>
  );
}
