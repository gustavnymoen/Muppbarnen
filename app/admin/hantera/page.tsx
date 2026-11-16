import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/app/components/Avatar";
import { IconLink } from "@/app/components/Button";
import { BackLink } from "@/app/components/BackLink";
import { Card } from "@/app/components/Card";
import { ConfirmAction } from "@/app/components/ConfirmAction";
import { CheckGroup, Field, Form } from "@/app/components/Form";
import { AddRow, FormCard } from "@/app/components/FormCard";
import { ImageIcon, ChecklistIcon, PencilIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { SlimCard } from "@/app/components/SlimCard";
import { requireAdminSession } from "@/lib/admin-auth";
import { childColor } from "@/lib/child-colors";
import { isExpected } from "@/lib/deck";
import { latestBirthdate } from "@/lib/form-input";
import { listFamilies, listParentFamilies, type Family } from "@/lib/families";
import { listChildren, listParents, type Child, type Parent } from "@/lib/family";
import { pictureUrl } from "@/lib/picture-url";
import { requireSiteSession } from "@/lib/site-auth";
import { removeChild, removeChildPicture, removeFamily, removeParent, saveChild, saveFamily, saveParent } from "../actions";
import { saveChildPicture } from "../picture-actions";

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
  const [parents, children, families, parentFamilies] = await Promise.all([listParents(), listChildren(), listFamilies(), listParentFamilies()]);

  return (
    <Page back={<BackLink href="/admin" />}>
      <PageContent>
        <div className="max-w-2xl space-y-5">
            <Heading level={1} small>
              Hantera
            </Heading>
            <Card as="section" className="space-y-3">
              <Heading level={2} small>
                Familjer
              </Heading>
              <ul className="space-y-2">
                {families.map((f) => (
                  <li key={f.id}>
                    <FamilyRow family={f} />
                  </li>
                ))}
              </ul>
              <AddRow>
                <FormCard title="Ny familj" label="Ny familj" add>
                  <FamilyForm submit="Lägg till" />
                </FormCard>
              </AddRow>
            </Card>
            <Card as="section" className="space-y-3">
              <Heading level={2} small>
                Föräldrar
              </Heading>
              <ul className="space-y-2">
                {parents.map((p) => (
                  <li key={p.id}>
                    <ParentRow parent={p} families={families} familyIds={parentFamilies.get(p.id) ?? []} />
                  </li>
                ))}
              </ul>
              <AddRow>
                <FormCard title="Ny förälder" label="Ny förälder" add>
                  <ParentForm submit="Lägg till" families={families} familyIds={families.length === 1 ? [families[0].id] : []} />
                </FormCard>
              </AddRow>
            </Card>
            <Card as="section" className="space-y-3">
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
              <AddRow>
                <FormCard title="Nytt barn" label="Nytt barn" add>
                  <ChildForm parents={parents} submit="Lägg till" />
                </FormCard>
              </AddRow>
            </Card>
          </div>
      </PageContent>
    </Page>
  );
}

function ParentRow({ parent, families, familyIds }: { parent: Parent; families: Family[]; familyIds: number[] }) {
  const names = families.filter((f) => familyIds.includes(f.id)).map((f) => f.name);
  return (
    <SlimCard
      title={parent.name}
      note={[parent.isMasterAdmin ? "Huvudadministratör" : "", names.join(", ")].filter(Boolean).join(" · ") || undefined}
      actions={
        <>
          <FormCard title={`Ändra ${parent.name}`} label={`Ändra ${parent.name}`} icon={<PencilIcon />}>
            <ParentForm parent={parent} submit="Spara" families={families} familyIds={familyIds} />
          </FormCard>
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
    />
  );
}

function FamilyRow({ family }: { family: Family }) {
  const counts = `${family.parents} ${family.parents === 1 ? "förälder" : "föräldrar"}, ${family.events} Secret Santa`;
  return (
    <SlimCard
      title={family.name}
      note={
        <>
          {family.description}
          <span className="block">{counts}</span>
        </>
      }
      actions={
        <>
          <FormCard title={`Ändra ${family.name}`} label={`Ändra ${family.name}`} icon={<PencilIcon />}>
            <FamilyForm family={family} submit="Spara" />
          </FormCard>
          <ConfirmAction
            action={removeFamily}
            fields={{ familyId: String(family.id) }}
            label="Ta bort"
            subject={family.name}
            title={`Ta bort ${family.name}?`}
            text={`${family.name} tas bort. Det går bara om familjen inte har några föräldrar eller Secret Santa.`}
          />
        </>
      }
    />
  );
}

function FamilyForm({ family, submit }: { family?: Family; submit: string }) {
  return (
    <Form action={saveFamily} submit={submit} says={{ field: "name", added: !family }}>
      {family && <input type="hidden" name="familyId" value={family.id} />}
      <Field name="name" label="Namn" defaultValue={family?.name} maxLength={60} required />
      <Field name="description" label="Beskrivning" defaultValue={family?.description} maxLength={30} hint="Visas när besökare väljer familj. Högst 30 tecken." />
    </Form>
  );
}

function ParentForm({ parent, submit, families, familyIds }: { parent?: Parent; submit: string; families: Family[]; familyIds: number[] }) {
  return (
    <Form action={saveParent} submit={submit} says={{ field: "name", added: !parent }}>
      {parent && <input type="hidden" name="parentId" value={parent.id} />}
      <Field name="name" label="Namn" defaultValue={parent?.name} maxLength={60} required />
      <CheckGroup name="families" label="Familjer" hint="Välj de familjer föräldern tillhör.">
        {families.map((f) => (
          <Field key={f.id} name={`family-${f.id}`} type="checkbox" label={f.name} defaultChecked={familyIds.includes(f.id)} />
        ))}
      </CheckGroup>
      <Field name="isMasterAdmin" type="checkbox" label="Huvudadministratör" defaultChecked={parent?.isMasterAdmin} hint="Får skapa och ändra föräldrar, barn och bilder." />
    </Form>
  );
}

function ChildRow({ child, parents }: { child: Child; parents: Parent[] }) {
  const owner = parents.find((p) => p.id === child.parentId);
  const src = pictureUrl(child.id, child.picture);
  return (
    <SlimCard
      thumb={<Avatar name={child.name} color={childColor(child.id)} src={src} size={32} decorative />}
      title={child.name}
      actions={
        <>
          <IconLink compact href={`/admin/barn/${child.id}/onskelistor`} label={`Önskelistor för ${child.name}`}>
            <ChecklistIcon />
          </IconLink>
          <FormCard title={`Ändra ${child.name}`} label={`Ändra ${child.name}`} icon={<PencilIcon />}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={child.name} color={childColor(child.id)} src={src} decorative />
                <p className="text-muted">
                  {isExpected(child.birthdate) ? "Beräknad" : "Född"} {child.birthdate}, förälder: {owner?.name}
                </p>
              </div>
              <ChildForm child={child} parents={parents} submit="Spara" />
            </div>
          </FormCard>
          <FormCard title={`Bild för ${child.name}`} label={`Bild för ${child.name}`} icon={<ImageIcon />}>
            <PictureCard child={child} src={src} />
          </FormCard>
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
    />
  );
}

// Barnets bild: den som finns (med knapp för att ta bort den) och ett fält för en ny
function PictureCard({ child, src }: { child: Child; src?: string }) {
  return (
    <div className="space-y-4">
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
      <Form action={saveChildPicture} submit="Spara bild" says={`Bilden för ${child.name} sparades`}>
        <input type="hidden" name="childId" value={child.id} />
        <Field name="picture" type="file" label="Bild" accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG eller WebP, högst 4 MB." required />
      </Form>
    </div>
  );
}

function ChildForm({ child, parents, submit }: { child?: Child; parents: Parent[]; submit: string }) {
  return (
    <Form action={saveChild} submit={submit} says={{ field: "name", added: !child }}>
      {child && <input type="hidden" name="childId" value={child.id} />}
      <Field name="name" label="Namn" defaultValue={child?.name} maxLength={60} required />
      <Field name="birthdate" type="date" label="Födelsedatum" defaultValue={child?.birthdate} max={latestBirthdate()} required />
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
