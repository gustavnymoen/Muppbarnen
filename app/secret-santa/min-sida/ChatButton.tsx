"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/app/components/Button";
import { Dialog, type DialogHandle } from "@/app/components/Dialog";
import { ChatIcon } from "@/app/components/icons";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type ChatSide } from "@/lib/santa-chat-shared";
import { loadChat, sendChat } from "../chat-actions";

// Chattknappen (MUPP-043): en kvarsittande knapp "Chatt" längst ner i listan; ett tryck öppnar samtalet som ett kort. Olästa meddelanden syns som en orange pratbubbla med en orange plupp och i namnet ("nytt meddelande"),
// så att det inte bara är färgen som säger det (R5); pricken går när samtalet är öppnat. Mottagarens sida kallas alltid "Din Secret Santa" (R3).
// Hur ofta ett öppet samtal frågar efter nya meddelanden
const POLL_MS = 10_000;

const TEXTS: Record<ChatSide, { title: string; label: string; empty: string }> = {
  receiver: { title: "Din Secret Santa", label: "Chatt med din Secret Santa", empty: "Inga meddelanden ännu. Skriv det du vill, din Secret Santa får inte veta vem du är." },
  giver: { title: "Din matchning", label: "Chatt med din matchning", empty: "Inga meddelanden ännu. Skriv det du vill, din matchning får inte veta vem du är." },
};

// unread och initial kommer från sidan. Märket följer unread rakt av och sparas inte i ett eget tillstånd: Next behåller tidigare besökta sidor med
// sitt tillstånd, så ett sparat "läst" skulle stå kvar och dölja ett nytt meddelande. När samtalet lästs laddas sidan om, och märket går.
export function ChatButton({ side, unread, initial }: { side: ChatSide; unread: boolean; initial: ChatMessage[] }) {
  const card = useRef<DialogHandle>(null);
  const texts = TEXTS[side];
  return (
    <>
      {/* Knapp längst ner i listan som står kvar när listan scrollas; mt-auto lägger den på sidans nederkant när listan är kort */}
      <div className="sticky bottom-0 mt-auto flex justify-center pt-2">
        <Button variant="secondary" aria-label={unread ? `${texts.label}, nytt meddelande` : texts.label} onClick={(event) => card.current?.open(event.currentTarget)} className="min-w-56">
          {/* Oläst: pratbubblan blir orange och får en orange plupp som sitter ihop med den, i hörnet */}
          <span className={`relative flex ${unread ? "text-claimed" : ""}`}>
            <ChatIcon />
            {unread && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-claimed" />}
          </span>
          Chatt
        </Button>
      </div>
      <Dialog ref={card} form title={texts.title}>
        <Chat side={side} empty={texts.empty} initial={initial} unread={unread} />
      </Dialog>
    </>
  );
}

// Innehållet finns bara medan kortet är öppet, så samtalet läses (och märks som läst) varje gång det öppnas
function Chat({ side, empty, initial, unread }: { side: ChatSide; empty: string; initial: ChatMessage[]; unread: boolean }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let current = true;
    loadChat(side).then((result) => {
      if (!result.ok) return current && setError(result.error);
      if (current) setMessages(result.messages);
      // Också när kortet hunnit stängas: meddelandena är lästa, så märket ska bort
      if (unread) router.refresh();
    });
    return () => {
      current = false;
    };
    // Samtalet ska läsas (och märkas som läst) en gång när kortet öppnas, inte när sidans data ändras
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  // Medan kortet är öppet frågas det efter nya meddelanden var tionde sekund (inte medan fliken är dold); ett nytt dyker upp i listan
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      loadChat(side).then((result) => result.ok && setMessages((now) => (JSON.stringify(now) === JSON.stringify(result.messages) ? now : result.messages)));
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [side]);

  // Nyaste meddelandet längst ner syns alltid
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages]);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = field.current?.value ?? "";
    startTransition(async () => {
      const result = await sendChat(side, text);
      if (!result.ok) return setError(result.error);
      setError("");
      setMessages(result.messages);
      if (field.current) field.current.value = "";
      field.current?.focus();
    });
  };

  return (
    <div className="mt-2 space-y-4">
      {/* role="log" läses upp av skärmläsaren när ett meddelande läggs till; tabIndex så att listan går att rulla med tangentbordet */}
      <div ref={list} role="log" aria-label="Samtalet" tabIndex={0} className="max-h-[50vh] space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-muted">{empty}</p>}
        {messages.map((message, i) => (
          <div key={i} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-control px-3 py-2 ${message.mine ? "bg-brand text-on-brand" : "border border-edge bg-page"}`}>
              <span className="sr-only">{message.mine ? "Du: " : "Svar: "}</span>
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="space-y-2" noValidate>
        <label htmlFor="chat-text" className="block font-heading font-medium">
          Meddelande
        </label>
        <textarea ref={field} id="chat-text" name="text" rows={3} maxLength={MAX_MESSAGE_LENGTH} aria-describedby="chat-error" className="min-h-11 w-full rounded-control border border-muted/75 bg-page px-4 py-2 text-text" />
        <p id="chat-error" role="alert" className="text-danger">
          {error}
        </p>
        <Button type="submit" disabled={pending}>
          Skicka
        </Button>
      </form>
    </div>
  );
}
