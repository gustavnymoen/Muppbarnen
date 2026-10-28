import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

// Mappen i stället för Blob: ingen BLOB_READ_WRITE_TOKEN, och en egen tillfällig mapp
let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "muppbarnen-bilder-"));
  process.env.PICTURES_DIR = dir;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});
afterAll(() => rm(dir, { recursive: true, force: true }));

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

describe("MUPP-003-R6 the picture store behind one small module", () => {
  test("MUPP-003-R6 a stored picture is read back with its type, and gone after it is removed", async () => {
    const { readPicture, removePicture, storePicture } = await import("./pictures");
    const name = await storePicture(5, png, "image/png");
    expect(name).toMatch(/^barn-5-[0-9a-f-]{36}\.png$/);
    const found = await readPicture(name);
    expect(found?.type).toBe("image/png");
    expect(Buffer.from(found!.body as Uint8Array)).toEqual(Buffer.from(png));
    await removePicture(name);
    expect(await readPicture(name)).toBeNull();
  });

  test("MUPP-003-R6 a name that is not one of ours is never read or removed, whatever the database says", async () => {
    const { readPicture, removePicture } = await import("./pictures");
    for (const name of ["../etc/passwd", "/etc/passwd", "barn-1-x.png", "barn-1-00000000-0000-0000-0000-000000000000.svg", ""]) {
      expect(await readPicture(name), name).toBeNull();
      await removePicture(name);
    }
  });

  test("MUPP-010-R4 removing a picture that is already gone is not an error", async () => {
    const { removePicture, storePicture } = await import("./pictures");
    const name = await storePicture(6, png, "image/png");
    await removePicture(name);
    await expect(removePicture(name)).resolves.toBeUndefined();
  });
});
