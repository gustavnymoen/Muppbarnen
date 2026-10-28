import { Suspense } from "react";
import { Card } from "@/app/components/Card";
import { Field, Form } from "@/app/components/Form";
import { Heading } from "@/app/components/Page";
import { saveSizes } from "../../../actions";
import { KidPage } from "../KidPage";

// Bara barnets storlekar (MUPP-010-R5)
export default function SizesPage({ params }: PageProps<"/admin/barn/[id]/storlekar">) {
  return (
    <Suspense fallback={null}>
      <KidPage
        params={params}
        content={(child) => (
          <Card as="section" className="space-y-4">
            <Heading level={2} small>
              Storlekar
            </Heading>
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
        )}
      />
    </Suspense>
  );
}
