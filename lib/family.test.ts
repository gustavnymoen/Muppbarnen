import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const family = await import("./family");
type Parent = import("./family").Parent;

const clear = async () => {
  await run("DELETE FROM wishlist_item");
  await run("DELETE FROM wishlist");
  await run("DELETE FROM child");
  await run("DELETE FROM parent");
};
beforeEach(clear);
afterAll(clear);

// Påhittade namn
async function parent(name: string, master = false): Promise<Parent> {
  const { lastId } = await run("INSERT INTO parent (name, is_master_admin) VALUES (?, ?)", [name, master ? 1 : 0]);
  return (await family.findParent(lastId))!;
}
async function child(owner: Parent, name = "Testbarn") {
  const { lastId } = await run("INSERT INTO child (parent_id, name, birthdate) VALUES (?, ?, '2020-05-17')", [owner.id, name]);
  return lastId;
}
const item = (childId: number, title: string, extra = {}) => ({
  childId: String(childId),
  occasion: "birthday",
  title,
  size: "",
  description: "",
  url: "",
  unlimited: false,
  ...extra,
});

describe("MUPP-003-R2 the first master admin", () => {
  test("MUPP-003-R2 creates the master admin while there are no parents, and is refused as soon as one exists", async () => {
    const first = await family.createFirstMaster("Gustav");
    expect(first.ok).toBe(true);
    expect(await family.listParents()).toMatchObject([{ name: "Gustav", isMasterAdmin: true }]);
    expect(await family.createFirstMaster("Någon annan")).toEqual({ ok: false, error: "Det finns redan en huvudadministratör." });
    expect(await family.listParents()).toHaveLength(1);
  });

  test("MUPP-003-R2 two at once create only one", async () => {
    const results = await Promise.all([family.createFirstMaster("A"), family.createFirstMaster("B")]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await family.listParents()).toHaveLength(1);
  });

  test("MUPP-003-R2 an empty or too long name is refused", async () => {
    expect(await family.createFirstMaster("  ")).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await family.createFirstMaster("a".repeat(61))).toMatchObject({ ok: false });
    expect(await family.listParents()).toHaveLength(0);
  });
});

describe("MUPP-003-R3 own kids only", () => {
  test("MUPP-003-R3 a parent reads only their own kids, the master can change all", async () => {
    const [mia, ola, master] = [await parent("Mia"), await parent("Ola"), await parent("Chef", true)];
    const miaKid = await child(mia, "Miabarn");
    await child(ola, "Olabarn");
    expect((await family.listChildren(mia.id)).map((c) => c.name)).toEqual(["Miabarn"]);
    expect(await family.listChildren()).toHaveLength(2);
    expect(family.canManage(mia, (await family.findChild(miaKid))!)).toBe(true);
    expect(family.canManage(ola, (await family.findChild(miaKid))!)).toBe(false);
    expect(family.canManage(master, (await family.findChild(miaKid))!)).toBe(true);
    expect(family.canManage(null, (await family.findChild(miaKid))!)).toBe(false);
  });

  test("MUPP-003-R3 sizes are saved, empty clears, 40 characters at most, and another parent's kid is refused", async () => {
    const [mia, ola] = [await parent("Mia"), await parent("Ola")];
    const kid = await child(mia);
    expect(await family.saveSizes(mia, String(kid), { clothes: " 128 ", shoes: "31", head: "52", gloves: "" })).toEqual({ ok: true });
    expect((await family.findChild(kid))!.sizes).toEqual({ clothes: "128", shoes: "31", head: "52", gloves: "" });
    expect(await family.saveSizes(mia, String(kid), { clothes: "", shoes: "31", head: "52", gloves: "" })).toEqual({ ok: true });
    expect((await family.findChild(kid))!.sizes.clothes).toBe("");

    const tooLong = await family.saveSizes(mia, String(kid), { clothes: "x".repeat(41), shoes: "1", head: "", gloves: "" });
    expect(tooLong).toMatchObject({ ok: false, fields: { clothes: "Högst 40 tecken." } });
    expect((await family.findChild(kid))!.sizes.shoes).toBe("31");

    expect(await family.saveSizes(ola, String(kid), { clothes: "hackad", shoes: "", head: "", gloves: "" })).toMatchObject({ ok: false });
    expect(await family.saveSizes(null, String(kid), { clothes: "hackad", shoes: "", head: "", gloves: "" })).toMatchObject({ ok: false });
    expect(await family.saveSizes(mia, "999999", { clothes: "x", shoes: "", head: "", gloves: "" })).toMatchObject({ ok: false });
    expect(await family.saveSizes(mia, "1 OR 1=1", { clothes: "x", shoes: "", head: "", gloves: "" })).toMatchObject({ ok: false });
    expect((await family.findChild(kid))!.sizes.clothes).toBe("");
  });
});

describe("MUPP-003-R4 wish lists", () => {
  test("MUPP-003-R4 an item is added to the chosen list, which is created with the first item, and edited", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    expect(await family.listWishlists(kid)).toEqual({ birthday: [], christmas: [] });
    expect(await family.saveItem(mia, item(kid, "Lego", { size: "L", description: "Stor ask", url: "https://exempel.se/lego", unlimited: true }))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "Cykel", { occasion: "christmas" }))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "Pussel"))).toEqual({ ok: true });
    const lists = await family.listWishlists(kid);
    expect(lists.birthday.map((i) => i.title)).toEqual(["Lego", "Pussel"]);
    expect(lists.christmas.map((i) => i.title)).toEqual(["Cykel"]);
    expect(lists.birthday[0]).toMatchObject({ size: "L", description: "Stor ask", url: "https://exempel.se/lego", unlimited: true });
    expect(lists.birthday[1].unlimited).toBe(false);
    // En lista per barn och tillfälle
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM wishlist WHERE child_id = ?", [kid]))!.n).toBe(2);

    const lego = lists.birthday[0];
    expect(await family.saveItem(mia, item(kid, "Lego Duplo", { itemId: String(lego.id) }))).toEqual({ ok: true });
    expect((await family.listWishlists(kid)).birthday[0]).toMatchObject({ title: "Lego Duplo", size: "", unlimited: false });
  });

  test("MUPP-003-R4 a missing name, a too long text and a bad link are refused with a message per field", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    const bad = await family.saveItem(mia, item(kid, "", { size: "x".repeat(41), description: "y".repeat(501), url: "javascript:alert(1)" }));
    expect(bad).toEqual({
      ok: false,
      fields: {
        title: "Fyll i det här fältet.",
        size: "Högst 40 tecken.",
        description: "Högst 500 tecken.",
        url: "Länken måste börja med http:// eller https://.",
      },
    });
    expect(await family.saveItem(mia, item(kid, "t".repeat(121)))).toMatchObject({ ok: false, fields: { title: "Högst 120 tecken." } });
    expect(await family.saveItem(mia, item(kid, "Ok", { occasion: "easter" }))).toMatchObject({ ok: false });
    expect((await family.listWishlists(kid)).birthday).toEqual([]);
  });

  test("MUPP-003-R4 texts are stored as given, never changed into HTML", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    await family.saveItem(mia, item(kid, "<b>Lego</b> & <script>x</script>"));
    expect((await family.listWishlists(kid)).birthday[0].title).toBe("<b>Lego</b> & <script>x</script>");
  });

  test("MUPP-003-R4 an item is removed, a list is cleared, and another parent's items and lists are refused", async () => {
    const [mia, ola] = [await parent("Mia"), await parent("Ola")];
    const kid = await child(mia);
    await family.saveItem(mia, item(kid, "A"));
    await family.saveItem(mia, item(kid, "B"));
    await family.saveItem(mia, item(kid, "C", { occasion: "christmas" }));
    const [a, b] = (await family.listWishlists(kid)).birthday;

    expect(await family.removeItem(ola, String(a.id))).toMatchObject({ ok: false });
    expect(await family.saveItem(ola, item(kid, "Intrång", { itemId: String(a.id) }))).toMatchObject({ ok: false });
    expect(await family.saveItem(ola, item(kid, "Intrång"))).toMatchObject({ ok: false });
    expect(await family.clearList(ola, String(kid), "birthday")).toMatchObject({ ok: false });
    expect((await family.listWishlists(kid)).birthday).toHaveLength(2);

    expect(await family.removeItem(mia, String(a.id))).toEqual({ ok: true });
    expect((await family.listWishlists(kid)).birthday.map((i) => i.id)).toEqual([b.id]);
    expect(await family.clearList(mia, String(kid), "birthday")).toEqual({ ok: true });
    const lists = await family.listWishlists(kid);
    expect(lists.birthday).toEqual([]);
    expect(lists.christmas).toHaveLength(1);
  });
});

describe("MUPP-014-R1 sizes for the deck", () => {
  test("listDeckInput reads the four sizes of every kid, empty where none are saved", async () => {
    const mia = await parent("Mia");
    const [withSizes, without] = [await child(mia, "Med"), await child(mia, "Utan")];
    await family.saveSizes(mia, String(withSizes), { clothes: "122", shoes: "30", head: "", gloves: "S" });
    const { children } = await family.listDeckInput();
    expect(children.find((c) => c.id === withSizes)!.sizes).toEqual({ clothes: "122", shoes: "30", head: "", gloves: "S" });
    expect(children.find((c) => c.id === without)!.sizes).toEqual({ clothes: "", shoes: "", head: "", gloves: "" });
  });
});

describe("MUPP-003-R5 parents and kids, master admin only", () => {
  test("MUPP-003-R5 a parent who is not master admin can neither create nor change parents or kids", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    expect(await family.saveParent(mia, { name: "Ny", isMasterAdmin: false })).toMatchObject({ ok: false });
    expect(await family.saveParent(mia, { id: String(mia.id), name: "Mia", isMasterAdmin: true })).toMatchObject({ ok: false });
    expect(await family.removeParent(mia, String(mia.id))).toMatchObject({ ok: false });
    expect(await family.saveChild(mia, { name: "Nytt", birthdate: "2021-01-01", parentId: String(mia.id) })).toMatchObject({ ok: false });
    expect(await family.saveChild(mia, { id: String(kid), name: "Bytt", birthdate: "2021-01-01", parentId: String(mia.id) })).toMatchObject({ ok: false });
    expect(await family.removeChild(mia, String(kid))).toMatchObject({ ok: false });
    expect(await family.childForPicture(mia, String(kid))).toBeUndefined();
    expect(await family.saveParent(null, { name: "Ny", isMasterAdmin: true })).toMatchObject({ ok: false });
    expect(await family.listParents()).toHaveLength(1);
    expect((await family.findChild(kid))!.name).toBe("Testbarn");
  });

  test("MUPP-003-R5 the master admin adds and edits parents and kids, and moves a kid to another parent", async () => {
    const master = await parent("Chef", true);
    expect(await family.saveParent(master, { name: "Mia", isMasterAdmin: false })).toEqual({ ok: true });
    const mia = (await family.listParents()).find((p) => p.name === "Mia")!;
    expect(await family.saveParent(master, { id: String(mia.id), name: "Mia B", isMasterAdmin: false })).toEqual({ ok: true });
    expect((await family.findParent(mia.id))!.name).toBe("Mia B");

    expect(await family.saveChild(master, { name: "Kim", birthdate: "2019-03-09", parentId: String(master.id) })).toEqual({ ok: true });
    const kim = (await family.listChildren(master.id))[0];
    expect(await family.saveChild(master, { id: String(kim.id), name: "Kim", birthdate: "2019-03-09", parentId: String(mia.id) })).toEqual({ ok: true });
    expect((await family.listChildren(mia.id)).map((c) => c.name)).toEqual(["Kim"]);
    expect(await family.listChildren(master.id)).toEqual([]);
  });

  test("MUPP-003-R5 a name is needed, the birthdate must be real and not too far ahead (MUPP-011-R1), and the parent must exist", async () => {
    const master = await parent("Chef", true);
    const base = { name: "Kim", birthdate: "2019-03-09", parentId: String(master.id) };
    expect(await family.saveParent(master, { name: "", isMasterAdmin: false })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await family.saveParent(master, { name: "x".repeat(61), isMasterAdmin: false })).toMatchObject({ ok: false });
    expect(await family.saveChild(master, { ...base, name: "" })).toMatchObject({ ok: false, fields: { name: expect.any(String) } });
    expect(await family.saveChild(master, { ...base, birthdate: "2999-01-01" })).toMatchObject({ ok: false, fields: { birthdate: expect.any(String) } });
    expect(await family.saveChild(master, { ...base, birthdate: "2021-02-30" })).toMatchObject({ ok: false });
    expect(await family.saveChild(master, { ...base, parentId: "99999" })).toMatchObject({ ok: false, fields: { parentId: "Välj en förälder." } });
    expect(await family.saveChild(master, { ...base, parentId: "x" })).toMatchObject({ ok: false });
    expect(await family.listChildren()).toEqual([]);
  });

  test("MUPP-003-R5 removing a kid removes its lists and items and gives back the picture name; a parent with kids cannot be removed", async () => {
    const master = await parent("Chef", true);
    const mia = await parent("Mia");
    const kid = await child(mia);
    await family.setChildPicture(kid, "barn-1-x.png");
    await family.saveItem(master, item(kid, "Lego"));

    expect(await family.removeParent(master, String(mia.id))).toEqual({ ok: false, error: "Föräldern har barn. Flytta eller ta bort barnen först." });
    expect(await family.removeChild(master, String(kid))).toEqual({ ok: true, picture: "barn-1-x.png" });
    expect(await family.findChild(kid)).toBeUndefined();
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM wishlist_item"))!.n).toBe(0);
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM wishlist"))!.n).toBe(0);
    expect(await family.removeParent(master, String(mia.id))).toEqual({ ok: true });
    expect(await family.findParent(mia.id)).toBeUndefined();
  });

  test("MUPP-003-R5 the last master admin can be neither removed nor lose the flag; it can be handed on first", async () => {
    const master = await parent("Chef", true);
    const mia = await parent("Mia");
    expect(await family.removeParent(master, String(master.id))).toEqual({ ok: false, error: "Det måste finnas minst en huvudadministratör." });
    expect(await family.saveParent(master, { id: String(master.id), name: "Chef", isMasterAdmin: false })).toMatchObject({ ok: false });
    expect((await family.findParent(master.id))!.isMasterAdmin).toBe(true);

    expect(await family.saveParent(master, { id: String(mia.id), name: "Mia", isMasterAdmin: true })).toEqual({ ok: true });
    expect(await family.saveParent(master, { id: String(master.id), name: "Chef", isMasterAdmin: false })).toEqual({ ok: true });
    expect((await family.findParent(master.id))!.isMasterAdmin).toBe(false);
    // Nu är Mia den sista
    const newMaster = (await family.findParent(mia.id))!;
    expect(await family.removeParent(newMaster, String(mia.id))).toMatchObject({ ok: false });
  });
});

describe("MUPP-010-R4 removing a kid's picture", () => {
  test("MUPP-010-R4 the master admin clears the picture and gets its name back; the kid stays", async () => {
    const master = await parent("Chef", true);
    const kid = await child(await parent("Mia"));
    await family.setChildPicture(kid, "barn-1-x.png");
    expect(await family.clearChildPicture(master, String(kid))).toEqual({ ok: true, picture: "barn-1-x.png" });
    expect((await family.findChild(kid))?.picture).toBe("");
    expect(await family.clearChildPicture(master, String(kid))).toEqual({ ok: true, picture: "" });
  });

  test("MUPP-010-R4 a parent, a visitor, a bad id and a missing kid are refused and nothing changes", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    await family.setChildPicture(kid, "barn-1-x.png");
    for (const [who, id] of [[mia, String(kid)], [null, String(kid)], [await parent("Chef", true), "x"], [await parent("Chef2", true), "99999"]] as const) {
      expect(await family.clearChildPicture(who, id)).toMatchObject({ ok: false });
    }
    expect((await family.findChild(kid))?.picture).toBe("barn-1-x.png");
  });
});

describe("MUPP-003-R7 queries are parameterised", () => {
  test("MUPP-003-R7 SQL in a name is stored as text and does nothing", async () => {
    const master = await parent("Chef", true);
    const evil = "x'); DROP TABLE child; --";
    expect(await family.saveParent(master, { name: evil, isMasterAdmin: false })).toEqual({ ok: true });
    expect((await family.listParents()).map((p) => p.name)).toContain(evil);
    expect(await get("SELECT 1 FROM sqlite_master WHERE name = 'child'")).toBeDefined();
  });
});

describe("MUPP-005-R5 claiming", () => {
  const today = { year: 2026, month: 10, day: 30 };
  // Påhittade önskningar: ledig, ledig, kan köpas flera gånger
  async function wishes(childName = "Testbarn") {
    const owner = await parent("Förälder", true);
    const childId = await child(owner, childName);
    for (const [title, unlimited] of [["Cykel", false], ["Pussel", false], ["Strumpor", true]] as const) await family.saveItem(owner, item(childId, title, { unlimited }));
    return (await family.listWishlists(childId)).birthday;
  }
  const state = (id: number) => get<{ claimed_by: string | null; claimed_at: string | null }>("SELECT claimed_by, claimed_at FROM wishlist_item WHERE id = ?", [id]);

  test("MUPP-005-R4 R5 several free wishes get the trimmed name and today's date", async () => {
    const [cykel, pussel] = await wishes();
    expect(await family.claimWishes([cykel.id, pussel.id], "  Moster Lisa  ", today)).toMatchObject({ ok: true, claimed: 2 });
    expect(await state(cykel.id)).toEqual({ claimed_by: "Moster Lisa", claimed_at: "2026-10-30" });
    expect(await state(pussel.id)).toEqual({ claimed_by: "Moster Lisa", claimed_at: "2026-10-30" });
  });

  test("MUPP-005-R5 an unlimited wish is not claimed, and the others in the request still are", async () => {
    const [cykel, , strumpor] = await wishes();
    expect(await family.claimWishes([cykel.id, strumpor.id], "Moster", today)).toEqual({ ok: false, claimed: 1, notClaimed: ["Strumpor"], missing: 0 });
    expect(await state(strumpor.id)).toEqual({ claimed_by: null, claimed_at: null });
    expect((await state(cykel.id))!.claimed_by).toBe("Moster");
  });

  test("MUPP-005-R5 a claimed wish is never overwritten", async () => {
    const [cykel] = await wishes();
    await family.claimWishes([cykel.id], "Första", today);
    expect(await family.claimWishes([cykel.id], "Andra", { ...today, day: 31 })).toMatchObject({ ok: false, claimed: 0, notClaimed: ["Cykel"] });
    expect(await state(cykel.id)).toEqual({ claimed_by: "Första", claimed_at: "2026-10-30" });
  });

  test("MUPP-005-R5 a wish that does not exist is reported and nothing else changes", async () => {
    const [cykel] = await wishes();
    expect(await family.claimWishes([cykel.id, 999999], "Moster", today)).toEqual({ ok: false, claimed: 1, notClaimed: [], missing: 1 });
  });

  test("MUPP-005-R5 the name is checked: empty, blank and over 60 characters claim nothing", async () => {
    const [cykel] = await wishes();
    for (const name of ["", "   ", "a".repeat(61), null, 5]) {
      expect(await family.claimWishes([cykel.id], name, today), String(name)).toMatchObject({ ok: false, claimed: 0, error: expect.any(String) });
    }
    expect(await family.claimWishes([cykel.id], "a".repeat(60), today)).toMatchObject({ ok: true });
  });

  test("MUPP-005-R5 the ids are checked: none, not a list, not numbers, too many", async () => {
    const [cykel] = await wishes();
    for (const ids of [[], "1", null, [-1], [1.5], ["x"], [cykel.id, "1; DROP TABLE wishlist_item"], Array.from({ length: 51 }, (_, i) => i + 1)]) {
      expect(await family.claimWishes(ids, "Moster", today), JSON.stringify(ids)).toMatchObject({ ok: false, claimed: 0, error: expect.any(String) });
    }
    expect((await state(cykel.id))!.claimed_by).toBeNull();
  });

  test("MUPP-005-R5 the same id twice counts once", async () => {
    const [cykel] = await wishes();
    expect(await family.claimWishes([cykel.id, cykel.id], "Moster", today)).toMatchObject({ ok: true, claimed: 1 });
  });
});
