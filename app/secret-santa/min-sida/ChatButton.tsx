"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button, IconButton } from "@/app/components/Button";
import { Dialog, type DialogHandle } from "@/app/components/Dialog";
import { ChatIcon } from "@/app/components/icons";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type ChatSide } from "@/lib/santa-chat-shared";
import { loadChat, sendChat } from "../chat-actions";

// Pratbubblan (MUPP-043): ett tryck öppnar samtalet som ett kort. Olästa meddelanden syns som en orange prick och i namnet ("nytt meddelande"),
// så att det inte bara är färgen som säger det (R5); pricken går när samtalet är öppnat. Mottagarens sida kallas alltid "Din Secret Santa" (R3).
const TEXTS: Record<ChatSide, { title: string; label: string; empty: string }> = {
  receiver: { title: "Din Secret Santa", label: "Chatta med din Secret Santa", empty: "Inga meddelanden ännu. Skriv det du vill, din Secret Santa får inte veta vem du är." },
  giver: { title: "Din matchning", label: "Chatta med din matchning", empty: "Inga meddelanden ännu. Skriv det du vill, din matchning får inte veta vem du är." },
};

export function ChatButton({ side, unread }: { side: ChatSide; unread: boolean }) {
  const card = useRef<DialogHandle>(null);
  const [notice, setNotice] = useState(unread);
  const texts = TEXTS[side];
  return (
    <>
      <IconButton label={notice ? `${texts.label}, nytt meddelande` : texts.label} onClick={(event) => card.current?.open(event.currentTarget)} className={`relative ${notice ? "!border-claimed !text-claimed" : ""}`}>
        <ChatIcon />
        {notice && <span aria-hidden="true" className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card bg-claimed" />}
      </IconButton>
      <Dialog ref={card} form title={texts.title}>
        <Chat side={side} empty={texts.empty} onRead={() => setNotice(false)} />
      </Dialog>
    </>
  );
}

// Innehållet finns bara medan kortet är öppet, så samtalet läses (och märks som läst) varje gång det öppnas
function Chat({ side, empty, onRead }: { side: ChatSide; empty: string; onRead: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let current = true;
    loadChat(side).then((result) => {
      if (!current) return;
      if (result.ok) {
        setMessages(result.messages);
        onRead();
      } else setError(result.error);
    });
    return () => {
      current = false;
    };
    // onRead är en ny funktion vid varje rendering av knappen; samtalet ska läsas en gång när kortet öppnas
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {messages?.length === 0 && <p className="text-muted">{empty}</p>}
        {messages?.map((message, i) => (
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
        <Button type="submit" disabled={pending || messages === null}>
          Skicka
        </Button>
      </form>
    </div>
  );
}
