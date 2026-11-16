"use server";

import { openSiteAction } from "@/lib/action-open";
import { currentSantaMember, type SantaMember } from "@/lib/santa-auth";
import { openChat, parseSide, sendMessage } from "@/lib/santa-chat";
import type { ChatResult, ChatSide } from "@/lib/santa-chat-shared";

// Samtalets serveråtgärder (MUPP-043). Först sajtkakan och gränsen för skrivande anrop, sedan vem som är inloggad (ur kakan,
// aldrig ur anropet); anropet säger bara vilken sida hen står på, och paret läses ur dragningen (lib/santa-chat.ts).
// Svaret är bara { mine, text } per meddelande, aldrig något som säger vem den andra är.

// Den inloggade medlemmen ur kakan och sidan hen står på, eller ett fel
async function asMember(eventId: unknown, rawSide: unknown): Promise<{ error: string } | { member: SantaMember; side: ChatSide }> {
  const member = await currentSantaMember(eventId);
  const side = parseSide(rawSide);
  return member && side !== null ? { member, side } : { error: "Du kan inte göra det här." };
}

// Öppnar samtalet: meddelandena, och det som den andra skrivit märks som läst (R5)
export async function loadChat(eventId: unknown, rawSide: unknown): Promise<ChatResult> {
  const { refusal } = await openSiteAction();
  if (refusal) return { ok: false, error: refusal };
  const who = await asMember(eventId, rawSide);
  return "error" in who ? { ok: false, error: who.error } : openChat(who.member.id, who.side);
}

export async function sendChat(eventId: unknown, rawSide: unknown, rawText: unknown): Promise<ChatResult> {
  const { refusal } = await openSiteAction();
  if (refusal) return { ok: false, error: refusal };
  const who = await asMember(eventId, rawSide);
  return "error" in who ? { ok: false, error: who.error } : sendMessage(who.member.id, who.side, rawText);
}
