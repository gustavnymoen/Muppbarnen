import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/app/components/Avatar";
import { IconLink, LinkButton } from "@/app/components/Button";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { FoldButton, FoldGroup, FoldPanel, FoldToggle } from "@/app/components/Fold";
import { Field, Form } from "@/app/components/Form";
import { ImageIcon, ChecklistIcon, PencilIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { listChildren, listParents, type Child, type Parent } from "@/lib/family";
import { requireSiteSession } from "@/lib/site-auth";
import { removeChild, removeChildPicture, removeParent, saveChild, saveChildPicture, saveParent } from "../actions";

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
        <FoldGroup>
          <div className="space-y-5">
            <LinkButton href="/admin">Till barnen</LinkButton>
            <Heading level={1} small>
              Hantera
            </Heading>
            <section className="space-y-3">
              <Heading level={2} small>
                Föräldrar
              </Heading>
              <ul className="space-y-2">
                {parents.map((p) => (
                  <li key={p.id}>
                    <ParentRow parent={p} />
                  </li>
                ))}
              </ul>
              <FoldButton id="ny-forälder" label="Ny förälder">
                Ny förälder
              </FoldButton>
              <FoldPanel id="ny-forälder">
                <ParentForm submit="Lägg till" />
              </FoldPanel>
            </section>
            <section className="space-y-3">
              <Heading level={2} small>
                Barn
              </Heading>
              {children.length === 0 && <p className="text-muted">Inga barn ännu.</p>}
              <ul className="space-y-2">
                {children.map((child) => (
                  <li key={child.id}>
                    <ChildRow child={child} parents={parents} />
                  </li>
                ))}
              </ul>
              <FoldButton id="nytt-barn" label="Nytt barn">
                Nytt barn
              </FoldButton>
              <FoldPanel id="nytt-barn">
                <ChildForm parents={parents} submit="Lägg till" />
              </FoldPanel>
            </section>
          </div>
        </FoldGroup>
      </PageContent>
    </Page>
  );
}

function ParentRow({ parent }: { parent: Parent }) {
  const edit = `forälder-${parent.id}`;
  return (
    <SlimCard
      title={parent.name}
      note={parent.isMasterAdmin ? "Huvudadministratör" : undefined}
      actions={
        <>
          <FoldToggle id={edit} label={`Ändra ${parent.name}`}>
            <PencilIcon />
          </FoldToggle>
          <ConfirmAction
            action={removeParent}
            fields={{ parentId: String(parent.id) }}
            label="Ta bort"
            subject={parent.name}
            title={`Ta bort ${parent.name}?`}
            text={`${parent.name} tas bort. Det går bara om föräldern inte har några barn.`}
          />
        </>
      }
    >
      <FoldPanel id={edit}>
        <ParentForm parent={parent} submit="Spara" />
      </FoldPanel>
    </SlimCard>
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
  const src = child.picture ? `/bilder/${child.id}` : undefined;
  const edit = `barn-${child.id}`;
  const picture = `bild-${child.id}`;
  return (
    <SlimCard
      thumb={<Avatar name={child.name} color={childColor(child.id)} src={src} size={32} decorative />}
      title={child.name}
      actions={
        <>
          <IconLink compact href={`/admin/barn/${child.id}`} label={`Önskelistor för ${child.name}`}>
            <ChecklistIcon />
          </IconLink>
          <FoldToggle id={edit} label={`Ändra ${child.name}`}>
            <PencilIcon />
          </FoldToggle>
          <FoldToggle id={picture} label={`Bild för ${child.name}`}>
            <ImageIcon />
          </FoldToggle>
          <ConfirmAction
            action={removeChild}
            fields={{ childId: String(child.id) }}
            label="Ta bort"
            subject={child.name}
            title={`Ta bort ${child.name}?`}
            text={`${child.name}, barnets önskelistor och bild tas bort. Det går inte att ångra.`}
          />
        </>
      }
    >
      <FoldPanel id={edit}>
        <div className="flex items-center gap-3">
          <Avatar name={child.name} color={childColor(child.id)} src={src} decorative />
          <p className="text-muted">
            Född {child.birthdate}, förälder: {owner?.name}
          </p>
        </div>
        <ChildForm child={child} parents={parents} submit="Spara" />
      </FoldPanel>
      <FoldPanel id={picture}>
        {src && (
          <div className="flex items-center gap-3">
            <Avatar name={child.name} color={childColor(child.id)} src={src} size={32} decorative />
            <span className="flex-1">Bild</span>
            <ConfirmAction
              action={removeChildPicture}
              fields={{ childId: String(child.id) }}
              label="Ta bort"
              subject={`bilden för ${child.name}`}
              title={`Ta bort bilden för ${child.name}?`}
              text={`Bilden för ${child.name} tas bort och ${child.name} visas med sin initial i stället. Det går inte att ångra.`}
            />
          </div>
        )}
        <Form action={saveChildPicture} submit="Spara bild">
          <input type="hidden" name="childId" value={child.id} />
          <Field name="picture" type="file" label="Bild" accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG eller WebP, högst 4 MB." required />
        </Form>
      </FoldPanel>
    </SlimCard>
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
