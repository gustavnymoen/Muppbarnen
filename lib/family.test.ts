import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { unitTestDbFile } from "./local-db.mjs";

// lib/db.ts väljer databasen när den läses in: enhetstesternas egen, aldrig den riktiga
process.env.TURSO_DATABASE_URL = `file:${unitTestDbFile}`;
const { run, get } = await import("./db");
const { parseDate } = await import("./deck");
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
const wishlists = async (childId: number) => family.listWishlists((await family.findChild(childId))!);
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
    expect(await wishlists(kid)).toEqual({ birthday: [], christmas: [], archive: [] });
    expect(await family.saveItem(mia, item(kid, "Lego", { size: "L", description: "Stor ask", url: "https://exempel.se/lego", unlimited: true }))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "Cykel", { occasion: "christmas" }))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "Pussel"))).toEqual({ ok: true });
    const lists = await wishlists(kid);
    expect(lists.birthday.map((i) => i.title)).toEqual(["Lego", "Pussel"]);
    expect(lists.christmas.map((i) => i.title)).toEqual(["Cykel"]);
    expect(lists.birthday[0]).toMatchObject({ size: "L", description: "Stor ask", url: "https://exempel.se/lego", unlimited: true });
    expect(lists.birthday[1].unlimited).toBe(false);
    // En lista per barn och tillfälle
    expect((await get<{ n: number }>("SELECT COUNT(*) AS n FROM wishlist WHERE child_id = ?", [kid]))!.n).toBe(2);

    const lego = lists.birthday[0];
    expect(await family.saveItem(mia, item(kid, "Lego Duplo", { itemId: String(lego.id) }))).toEqual({ ok: true });
    expect((await wishlists(kid)).birthday[0]).toMatchObject({ title: "Lego Duplo", size: "", unlimited: false });
  });

  test("MUPP-003-R4 a missing name, a too long text and a bad link are refused with a message per field", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    const bad = await family.saveItem(mia, item(kid, "", { size: "x".repeat(41), description: "y".repeat(101), url: "javascript:alert(1)" }));
    expect(bad).toEqual({
      ok: false,
      fields: {
        title: "Fyll i det här fältet.",
        size: "Högst 40 tecken.",
        description: "Högst 100 tecken.",
        url: "Länken måste börja med http:// eller https://.",
      },
    });
    expect(await family.saveItem(mia, item(kid, "t".repeat(61)))).toMatchObject({ ok: false, fields: { title: "Högst 60 tecken." } });
    expect(await family.saveItem(mia, item(kid, "Ok", { occasion: "easter" }))).toMatchObject({ ok: false });
    expect((await wishlists(kid)).birthday).toEqual([]);
  });

  test("MUPP-023-R3 a title of 60 characters is saved and one of 61 is refused", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    expect(await family.saveItem(mia, item(kid, "t".repeat(60)))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "t".repeat(61)))).toEqual({ ok: false, fields: { title: "Högst 60 tecken." } });
  });

  test("MUPP-018-R1 a description of 100 characters is saved and one of 101 is refused", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    expect(await family.saveItem(mia, item(kid, "Ok", { description: "d".repeat(100) }))).toEqual({ ok: true });
    expect(await family.saveItem(mia, item(kid, "För lång", { description: "d".repeat(101) }))).toEqual({ ok: false, fields: { description: "Högst 100 tecken." } });
    expect((await wishlists(kid)).birthday).toHaveLength(1);
  });

  test("MUPP-003-R4 texts are stored as given, never changed into HTML", async () => {
    const mia = await parent("Mia");
    const kid = await child(mia);
    await family.saveItem(mia, item(kid, "<b>Lego</b> & <script>x</script>"));
    expect((await wishlists(kid)).birthday[0].title).toBe("<b>Lego</b> & <script>x</script>");
  });

  test("MUPP-003-R4 an item is removed, a list is cleared, and another parent's items and lists are refused", async () => {
    const [mia, ola] = [await parent("Mia"), await parent("Ola")];
    const kid = await child(mia);
    await family.saveItem(mia, item(kid, "A"));
    await family.saveItem(mia, item(kid, "B"));
    await family.saveItem(mia, item(kid, "C", { occasion: "christmas" }));
    const [a, b] = (await wishlists(kid)).birthday;

    expect(await family.removeItem(ola, String(a.id))).toMatchObject({ ok: false });
    expect(await family.saveItem(ola, item(kid, "Intrång", { itemId: String(a.id) }))).toMatchObject({ ok: false });
    expect(await family.saveItem(ola, item(kid, "Intrång"))).toMatchObject({ ok: false });
    expect(await family.clearList(ola, String(kid), "birthday")).toMatchObject({ ok: false });
    expect((await wishlists(kid)).birthday).toHaveLength(2);

    expect(await family.removeItem(mia, String(a.id))).toEqual({ ok: true });
    expect((await wishlists(kid)).birthday.map((i) => i.id)).toEqual([b.id]);
    expect(await family.clearList(mia, String(kid), "birthday")).toEqual({ ok: true });
    const lists = await wishlists(kid);
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
    // Tillagda samma dag som de paxas, så att de aldrig hunnit arkiveras (MUPP-031)
    for (const [title, unlimited] of [["Cykel", false], ["Pussel", false], ["Strumpor", true]] as const) await family.saveItem(owner, item(childId, title, { unlimited }), today);
    return (await family.listWishlists((await family.findChild(childId))!, today)).birthday;
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

  // Samma påhittade önskningar, så att paxningen som tas bort är gjord som på riktigt
  describe("MUPP-006 removing a claim", () => {
    test("MUPP-006-R3 a claimed wish loses its name and date, and can be claimed again", async () => {
      const [cykel, pussel] = await wishes();
      await family.claimWishes([cykel.id, pussel.id], "Moster", today);
      expect(await family.unclaimWish(cykel.id)).toEqual({ ok: true });
      expect(await state(cykel.id)).toEqual({ claimed_by: null, claimed_at: null });
      expect((await state(pussel.id))!.claimed_by).toBe("Moster");
      expect(await family.claimWishes([cykel.id], "Farmor", today)).toMatchObject({ ok: true, claimed: 1 });
    });

    test("MUPP-006-R3 R4 an unclaimed, unlimited or missing wish is not changed and is reported", async () => {
      const [cykel, , strumpor] = await wishes();
      // En rad som kan köpas flera gånger går inte att paxa, men skulle den ändå ha ett namn ska det stå kvar
      await run("UPDATE wishlist_item SET claimed_by = 'Moster', claimed_at = '2026-10-30' WHERE id = ?", [strumpor.id]);
      expect(await family.unclaimWish(cykel.id)).toEqual({ ok: false });
      expect(await family.unclaimWish(strumpor.id)).toEqual({ ok: false });
      expect(await family.unclaimWish(999999)).toEqual({ ok: false });
      expect((await state(strumpor.id))!.claimed_by).toBe("Moster");
    });

    test("MUPP-006-R5 the id is checked: not a positive whole number changes nothing", async () => {
      const [cykel] = await wishes();
      await family.claimWishes([cykel.id], "Moster", today);
      for (const id of [0, -1, 1.5, "x", null, [cykel.id], `${cykel.id}; DROP TABLE wishlist_item`]) {
        expect(await family.unclaimWish(id), JSON.stringify(id)).toEqual({ ok: false, error: "Det gick inte att ta bort paxningen. Ladda om sidan och försök igen." });
      }
      expect((await state(cykel.id))!.claimed_by).toBe("Moster");
    });
  });
});

describe("MUPP-007-R1 who claimed what, for the admin page", () => {
  test("MUPP-007-R1 the lists give who claimed an item and when, and null for a free one", async () => {
    const owner = await parent("Mia");
    const kid = await child(owner);
    const today = { year: 2026, month: 10, day: 30 };
    await family.saveItem(owner, item(kid, "Cykel"), today);
    await family.saveItem(owner, item(kid, "Pussel"), today);
    const [cykel] = (await family.listWishlists((await family.findChild(kid))!, today)).birthday;
    await family.claimWishes([cykel.id], "Moster Lisa", today);
    const lists = (await family.listWishlists((await family.findChild(kid))!, today)).birthday;
    expect(lists.map(({ title, claimedBy, claimedAt }) => ({ title, claimedBy, claimedAt }))).toEqual([
      { title: "Cykel", claimedBy: "Moster Lisa", claimedAt: "2026-10-30" },
      { title: "Pussel", claimedBy: null, claimedAt: null },
    ]);
  });
});

describe("MUPP-031 the month after and the archive", () => {
  // Alma fyller år den 17 mars; månaden efter är 18 mars–16 april och den 17 april arkiveras listan. Påhittade datum.
  const on = parseDate;
  async function alma(owner: Parent) {
    const { lastId } = await run("INSERT INTO child (parent_id, name, birthdate) VALUES (?, 'Alma', '2019-03-17')", [owner.id]);
    return lastId;
  }
  const lists = async (kid: number, date: string) => family.listWishlists((await family.findChild(kid))!, on(date));
  const deckWishes = async (kid: number, date: string) => (await family.listDeckInput(on(date))).wishes.get(kid);
  const titles = (items: { title: string }[] | undefined) => (items ?? []).map((i) => i.title);
  const row = (id: number) => get<Record<string, unknown>>("SELECT title, claimed_by, added_at FROM wishlist_item WHERE id = ?", [id]);

  test("MUPP-031-R4 an item gets the day it was added", async () => {
    const mia = await parent("Mia");
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Cykel"), on("2026-03-01"));
    const [cykel] = (await lists(kid, "2026-03-01")).birthday;
    expect(await row(cykel.id)).toMatchObject({ added_at: "2026-03-01" });
  });

  test("MUPP-031-R4 the list stays to day 30, also with what was added and claimed after the birthday, and all of it is archived on day 31", async () => {
    const mia = await parent("Mia");
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Cykel"), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Strumpor", { unlimited: true }), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Pussel"), on("2026-04-10"));
    const [cykel] = (await lists(kid, "2026-04-10")).birthday;
    expect(await family.claimWishes([cykel.id], "Moster Lisa", on("2026-04-10"))).toMatchObject({ ok: true, claimed: 1 });

    expect(titles((await deckWishes(kid, "2026-04-16"))?.birthday)).toEqual(["Cykel", "Strumpor", "Pussel"]);
    expect(await lists(kid, "2026-04-16")).toMatchObject({ archive: [] });
    expect(titles((await lists(kid, "2026-04-16")).birthday)).toEqual(["Cykel", "Strumpor", "Pussel"]);

    expect(titles((await deckWishes(kid, "2026-04-17"))?.birthday)).toEqual([]);
    const after = await lists(kid, "2026-04-17");
    expect(after.birthday).toEqual([]);
    expect(after.archive).toMatchObject([
      {
        name: "Födelsedag 2026",
        items: [
          { title: "Cykel", claimedBy: "Moster Lisa" },
          { title: "Strumpor", unlimited: true, claimedBy: null },
          { title: "Pussel", claimedBy: null },
        ],
      },
    ]);
  });

  test("MUPP-031-R4 an archived item cannot be claimed, unclaimed, edited or removed", async () => {
    const mia = await parent("Mia", true);
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Cykel"), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Lego"), on("2026-03-01"));
    const [cykel, lego] = (await lists(kid, "2026-03-01")).birthday;
    await family.claimWishes([lego.id], "Moster Lisa", on("2026-03-02"));
    const day31 = on("2026-04-17");

    expect(await family.claimWishes([cykel.id], "Sen gäst", day31)).toEqual({ ok: false, claimed: 0, notClaimed: [], missing: 1 });
    expect(await family.unclaimWish(lego.id, day31)).toEqual({ ok: false });
    expect(await family.saveItem(mia, item(kid, "Ändrad", { itemId: String(cykel.id) }), day31)).toMatchObject({ ok: false });
    expect(await family.removeItem(mia, String(cykel.id), day31)).toMatchObject({ ok: false });
    expect(await row(cykel.id)).toEqual({ title: "Cykel", claimed_by: null, added_at: "2026-03-01" });
    expect(await row(lego.id)).toMatchObject({ claimed_by: "Moster Lisa" });
  });

  test("MUPP-031-R5 the archive has one group per occasion and year, newest first; Christmas Eve is named by its own year", async () => {
    const mia = await parent("Mia");
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Docka"), on("2025-03-01"));
    await family.saveItem(mia, item(kid, "Cykel"), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Pulka", { occasion: "christmas" }), on("2026-12-01"));
    await family.saveItem(mia, item(kid, "Skridskor", { occasion: "christmas" }), on("2027-01-10"));
    const { archive } = await lists(kid, "2027-01-24");
    expect(archive.map((g) => [g.name, titles(g.items)])).toEqual([
      ["Julafton 2026", ["Pulka", "Skridskor"]],
      ["Födelsedag 2026", ["Cykel"]],
      ["Födelsedag 2025", ["Docka"]],
    ]);
  });

  test("MUPP-031-R5 Töm listan removes only the items that are not archived", async () => {
    const mia = await parent("Mia");
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Gammal"), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Ny"), on("2026-04-17"));
    expect(await family.clearList(mia, String(kid), "birthday", on("2026-04-17"))).toEqual({ ok: true });
    const after = await lists(kid, "2026-04-17");
    expect(after.birthday).toEqual([]);
    expect(after.archive.flatMap((g) => titles(g.items))).toEqual(["Gammal"]);
  });

  test("MUPP-031-R7 copying an archived item gives an unclaimed copy, added today, and leaves the archive as it was", async () => {
    const mia = await parent("Mia");
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Cykel", { size: "20 tum", description: "Blå", url: "https://exempel.se/cykel", unlimited: false }), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Strumpor", { unlimited: true }), on("2026-03-01"));
    const [cykel, strumpor] = (await lists(kid, "2026-03-01")).birthday;
    await family.claimWishes([cykel.id], "Moster Lisa", on("2026-03-02"));
    const day31 = on("2026-04-17");

    expect(await family.copyArchivedItem(mia, String(cykel.id), "christmas", day31)).toEqual({ ok: true });
    expect(await family.copyArchivedItem(mia, String(strumpor.id), "birthday", day31)).toEqual({ ok: true });
    const after = await lists(kid, "2026-04-17");
    expect(after.christmas).toMatchObject([{ title: "Cykel", size: "20 tum", description: "Blå", url: "https://exempel.se/cykel", unlimited: false }]);
    expect(after.birthday).toMatchObject([{ title: "Strumpor", unlimited: true }]);
    expect(await row(after.christmas[0].id)).toEqual({ title: "Cykel", claimed_by: null, added_at: "2026-04-17" });
    expect(after.archive).toMatchObject([{ items: [{ id: cykel.id, claimedBy: "Moster Lisa" }, { id: strumpor.id }] }]);
  });

  test("MUPP-031-R7 copying is refused for an item that is not archived, another parent's kid, and a bad list or id", async () => {
    const [mia, ola] = [await parent("Mia"), await parent("Ola")];
    const kid = await alma(mia);
    await family.saveItem(mia, item(kid, "Gammal"), on("2026-03-01"));
    await family.saveItem(mia, item(kid, "Ny"), on("2026-04-17"));
    const { birthday, archive } = await lists(kid, "2026-04-17");
    const day31 = on("2026-04-17");
    const count = async () => (await get<{ n: number }>("SELECT COUNT(*) AS n FROM wishlist_item"))!.n;

    expect(await family.copyArchivedItem(mia, String(birthday[0].id), "christmas", day31)).toMatchObject({ ok: false });
    expect(await family.copyArchivedItem(ola, String(archive[0].items[0].id), "christmas", day31)).toMatchObject({ ok: false });
    expect(await family.copyArchivedItem(null, String(archive[0].items[0].id), "christmas", day31)).toMatchObject({ ok: false });
    expect(await family.copyArchivedItem(mia, String(archive[0].items[0].id), "easter", day31)).toMatchObject({ ok: false });
    for (const id of ["1 OR 1=1", "", "999999", "-1"]) expect(await family.copyArchivedItem(mia, id, "christmas", day31), id).toMatchObject({ ok: false });
    expect(await count()).toBe(2);
  });
});
