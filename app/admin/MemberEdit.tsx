"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/app/components/Button";
import { Dialog, type DialogHandle } from "@/app/components/Dialog";
import { FormCard } from "@/app/components/FormCard";
import { Form } from "@/app/components/Form";
import { PencilIcon } from "@/app/components/icons";
import { toast } from "@/app/components/Toaster";
import type { FormState } from "@/app/components/form-state";
import { mailNewAddress, saveMember } from "./santa-actions";

type Ask = NonNullable<NonNullable<FormState>["ask"]>;

// Pennan på en deltagare (MUPP-038, MUPP-060): kortet med fälten, och när e-posten ändrats frågan om den nya adressen ska få mejlet.
// Frågan kommer först när kortet har stängts, och växer ur pennan.
export function MemberEdit({ memberId, title, children }: { memberId: number; title: string; children: ReactNode }) {
  const question = useRef<DialogHandle>(null);
  // asked (ref) avgör om frågan ska öppnas när kortet stängs; ask (state) är det frågan visar
  const asked = useRef<Ask | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);

  const save = async (previous: FormState, formData: FormData) => {
    const result = await saveMember(previous, formData);
    asked.current = result?.ask ?? null;
    if (result?.ask) setAsk(result.ask);
    return result;
  };
  // Kortet har stängt och gett fokus till pennan, som frågan växer ur
  const openQuestion = () => {
    if (!asked.current) return;
    asked.current = null;
    question.current?.open(document.activeElement as HTMLElement);
  };

  return (
    <>
      <FormCard title={title} label={title} icon={<PencilIcon />} onClose={openQuestion}>
        <Form action={save} submit="Spara" says={{ field: "name" }}>
          <input type="hidden" name="memberId" value={memberId} />
          {children}
        </Form>
      </FormCard>
      <Dialog ref={question} role="alertdialog" title="Skicka mejlet till den nya adressen?">
        {ask && <NewAddressQuestion ask={ask} dialog={question} />}
      </Dialog>
    </>
  );
}

function NewAddressQuestion({ ask, dialog }: { ask: Ask; dialog: React.RefObject<DialogHandle | null> }) {
  const id = useId();
  const [state, formAction, pending] = useActionState(mailNewAddress, null);

  useEffect(() => {
    if (state?.saved) {
      dialog.current?.close();
      toast(state.notice ?? "Mejlet skickades.", !!state.notice);
    } else if (state?.error) toast(state.error, true);
  }, [state, dialog]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="memberId" value={ask.memberId} />
      <p id={`${id}-text`}>Mejlet går till {ask.email}. Den gamla adressen får inget.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => dialog.current?.close()}>
          Inte nu
        </Button>
        <Button type="submit" disabled={pending}>
          Skicka
        </Button>
      </div>
    </form>
  );
}
