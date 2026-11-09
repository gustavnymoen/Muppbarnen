import { Suspense } from "react";
import { Button, IconButton, LinkButton } from "@/app/components/Button";
import { Card } from "@/app/components/Card";
import { Field, Form } from "@/app/components/Form";
import { SwapIcon } from "@/app/components/icons";
import { Heading, Page, PageContent } from "@/app/components/Page";
import { Tabs } from "@/app/components/Tabs";
import { currentAdmin } from "@/lib/admin-auth";
import { listChildren, listParents, type Parent } from "@/lib/family";
import { listFamilies } from "@/lib/santa";
import { requireSiteSession } from "@/lib/site-auth";
import { ChildCard } from "./ChildCard";
import { SantaTab } from "./SantaTab";
import { chooseParent, createMaster, leaveParent } from "./actions";
import { adminLogin } from "./login-action";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminContent />
    </Suspense>
  );
}

// Fyra lägen: inte inloggad, inga föräldrar än, ingen förälder vald, förälder vald
async function AdminContent() {
  await requireSiteSession();
  const admin = await currentAdmin();
  const parents = admin ? await listParents() : [];
  return (
    <Page>
      <PageContent>
        <div className="space-y-5">
          <Heading level={1} small>
            Admin
          </Heading>
          {!admin ? <SignIn /> : parents.length === 0 ? <FirstMaster /> : admin.parent ? <ParentHome parent={admin.parent} /> : <ChooseParent parents={parents} />}
        </div>
      </PageContent>
    </Page>
  );
}

function SignIn() {
  return (
    <Card className="max-w-md">
      <Form action={adminLogin} submit="Logga in">
        <Field name="password" type="password" label="Adminlösenord" autoComplete="current-password" required />
      </Form>
    </Card>
  );
}

// Medan det inte finns någon förälder: den första blir huvudadministratör
function FirstMaster() {
  return (
    <Card className="max-w-md space-y-4">
      <Heading level={2} small>
        Skapa huvudadministratör
      </Heading>
      <Form action={createMaster} submit="Skapa">
        <Field name="name" label="Namn" defaultValue="Gustav" maxLength={60} required />
      </Form>
    </Card>
  );
}

function ChooseParent({ parents }: { parents: Parent[] }) {
  return (
    <section className="space-y-3">
      <Heading level={2} small>
        Vem är du?
      </Heading>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {parents.map((parent) => (
          <li key={parent.id}>
            <form action={chooseParent}>
              <input type="hidden" name="parentId" value={parent.id} />
              <Button type="submit" variant="secondary" className="w-full">
                {parent.name}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function ParentHome({ parent }: { parent: Parent }) {
  const children = await listChildren(parent.id);
  const kids = (
    <>
      {children.length === 0 ? (
        <p className="text-muted">Inga barn ännu.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <li key={child.id}>
              <ChildCard child={child} />
            </li>
          ))}
        </ul>
      )}
      {parent.isMasterAdmin && (
        <section className="space-y-3">
          <Heading level={2} small>
            Hantera
          </Heading>
          <p className="text-muted">Barn, föräldrar och bilder.</p>
          <LinkButton href="/admin/hantera">Hantera barn och föräldrar</LinkButton>
        </section>
      )}
    </>
  );
  // Fliken Secret Santa finns bara för huvudadministratören; för andra hämtas inget av dess innehåll
  const santa = parent.isMasterAdmin ? await listFamilies(parent) : null;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p>
          Inloggad som <strong>{parent.name}</strong>
        </p>
        <form action={leaveParent}>
          <IconButton type="submit" round label="Byt förälder">
            <SwapIcon />
          </IconButton>
        </form>
      </div>
      {santa ? (
        <Tabs
          label="Admin"
          tabs={[
            { id: "barn", title: "Barn", content: kids },
            { id: "secret-santa", title: "Secret Santa", content: <SantaTab {...santa} /> },
          ]}
        />
      ) : (
        kids
      )}
    </>
  );
}
