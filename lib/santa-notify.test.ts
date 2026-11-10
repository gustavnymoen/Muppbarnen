import { beforeEach, describe, expect, test, vi } from "vitest";

// Utkorgen är en delad fil, så mejlen fångas här i stället (mail.test.ts testar själva sändningen)
const sent: { to: string; subject: string }[] = [];
vi.mock("./mail", () => ({
  sendMail: async (to: string, mail: { subject: string }) => {
    if (to.startsWith("fel@")) return { ok: false };
    sent.push({ to, subject: mail.subject });
    return { ok: true };
  },
}));
const { mailEveryone, mailNewMember, setAsideNotice, unsentNotice } = await import("./santa-notify");
const { activatedMail, addedMail, deactivatedMail } = await import("./santa-mail");

beforeEach(() => void (sent.length = 0));

describe("MUPP-051-R2 the mail to everyone", () => {
  test("MUPP-051-R2 every recipient gets the mail, and a failing one is named while the others still get theirs", async () => {
    const mail = deactivatedMail("Emmas jul");
    const names = await mailEveryone([{ name: "Anna", email: "anna@exempel.se" }, { name: "Bo", email: "fel@exempel.se" }, { name: "Cia", email: "cia@exempel.se" }], mail);
    expect(names).toEqual(["Bo"]);
    expect(sent).toEqual([{ to: "anna@exempel.se", subject: mail.subject }, { to: "cia@exempel.se", subject: mail.subject }]);
  });

  test("MUPP-051-R2 nobody to mail gives no mail and no name", async () => {
    expect(await mailEveryone([], activatedMail("Emmas jul", "Emma"))).toEqual([]);
    expect(sent).toEqual([]);
  });

  test("MUPP-051-R2 the notice names who got no mail", () => {
    expect(unsentNotice(["Bo", "Cia"])).toBe("Sparat, men Bo, Cia fick inget mejl.");
  });
});

describe("MUPP-051-R3 the mails to a new member", () => {
  const member = { name: "Anna", email: "anna@exempel.se", eventName: "Emmas jul", adminName: "Emma" };

  test("MUPP-051-R3 an inactive group gives the welcome mail only", async () => {
    expect(await mailNewMember({ ...member, preparing: false })).toBe(true);
    expect(sent).toEqual([{ to: "anna@exempel.se", subject: addedMail("Emmas jul", "Emma").subject }]);
  });

  test("MUPP-051-R3 a preparing group gives the welcome mail and right after it the activation mail", async () => {
    expect(await mailNewMember({ ...member, preparing: true })).toBe(true);
    expect(sent.map((m) => m.subject)).toEqual([addedMail("Emmas jul", "Emma").subject, activatedMail("Emmas jul", "Emma").subject]);
  });

  test("MUPP-051-R3 a failing address gives false and no second mail", async () => {
    expect(await mailNewMember({ ...member, email: "fel@exempel.se", preparing: true })).toBe(false);
    expect(sent).toEqual([]);
  });
});

describe("MUPP-041-R3 the notice about a set-aside rule", () => {
  test("MUPP-041-R3 it names the rules that were set aside and nobody else, and is empty when none was", () => {
    expect(setAsideNotice([])).toBe("");
    expect(setAsideNotice(["lastYear"])).toBe("Dragningen är gjord, men regeln om att inte få förra årets person gick inte att följa.");
    expect(setAsideNotice(["lastYear", "partner"])).toBe("Dragningen är gjord, men regeln om att inte få förra årets person och regeln om att inte få sin partner gick inte att följa.");
  });
});
