import "server-only";
import { sendMail, type Mail } from "./mail";
import type { NewMember, Recipient } from "./santa";
import type { SetAside } from "./santa-draw";
import { activatedMail, addedMail, startedMail } from "./santa-mail";

// Skickar Secret Santas mejl (MUPP-051) efter att en ändring är sparad. Ett mejl som inte går iväg ändrar inget som redan är sparat:
// svaret är namnen på dem som inte fick något, så att administratören kan höra av sig. Texterna finns i lib/santa-mail.ts.

// Samma mejl till alla; de som inte fick det
// shortcut: alla mejl skickas samtidigt, vilket duger för en familjegrupp; skicka i omgångar om grupperna blir stora
export async function mailEveryone(recipients: Recipient[], mail: Mail): Promise<string[]> {
  const results = await Promise.all(recipients.map(async (r) => ((await sendMail(r.email, mail)).ok ? null : r.name)));
  return results.filter((name): name is string => name !== null);
}

// En ny adress får mejlet en ny deltagare skulle fått i gruppens status: välkomstmejlet, och i en grupp som förbereder direkt efter det
// aktiveringsmejlet (MUPP-051-R3); i en startad grupp startmejlet (MUPP-060-R4). Sant om allt gick iväg.
export async function mailNewMember(member: NewMember): Promise<boolean> {
  if (member.status === "started") return (await sendMail(member.email, startedMail(member.eventName))).ok;
  if (!(await sendMail(member.email, addedMail(member.eventName, member.adminName))).ok) return false;
  return member.status !== "preparing" || (await sendMail(member.email, activatedMail(member.eventName, member.adminName))).ok;
}

// Texten som administratören ser när något mejl inte gick iväg
export const unsentNotice = (names: string[]) => `Sparat, men ${names.join(", ")} fick inget mejl.`;

// Texten som administratören ser när dragningen fick släppa en regel (MUPP-041-R3); aldrig vem som drog vem
export const setAsideNotice = (rules: SetAside[]) =>
  rules.length === 0
    ? ""
    : `Dragningen är gjord, men ${rules.map((r) => (r === "lastYear" ? "regeln om att inte få förra årets person" : "regeln om att inte få sin partner")).join(" och ")} gick inte att följa.`;
