import { readdirSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

// Mappen i stället för Blob: ingen BLOB_READ_WRITE_TOKEN, och en egen tillfällig mapp
let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "muppbarnen-bilder-"));
  process.env.PICTURES_DIR = dir;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});
afterAll(() => rm(dir, { recursive: true, force: true }));

// En riktig bild av önskad storlek (sharp avkodar nu allt som sparas)
const picture = (width: number, height: number, format: "jpeg" | "png" = "png") =>
  sharp({ create: { width, height, channels: 3, background: "#c0392b" } })[format]().toBuffer();
const readStored = async (name: string) => {
  const { readPicture } = await import("./pictures");
  return Buffer.from((await readPicture(name))!.body as Uint8Array);
};

describe("MUPP-003-R6 the picture store behind one small module", () => {
  test("MUPP-003-R6 a stored picture is read back with its type, and gone after it is removed", async () => {
    const { readPicture, removePicture, storePicture } = await import("./pictures");
    const name = await storePicture(5, await picture(40, 40));
    expect(name).toMatch(/^barn-5-[0-9a-f-]{36}\.webp$/);
    expect((await readPicture(name))?.type).toBe("image/webp");
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
    const name = await storePicture(6, await picture(40, 40));
    await removePicture(name);
    await expect(removePicture(name)).resolves.toBeUndefined();
  });
});

describe("TECH-012 uploaded pictures are shrunk", () => {
  test("TECH-012-R1 a large picture is stored as WebP, at most 256 px on its longest side and far smaller than the original", async () => {
    const { storePicture } = await import("./pictures");
    const original = await picture(2000, 1000, "jpeg");
    const stored = await readStored(await storePicture(7, original));
    const info = await sharp(stored).metadata();
    expect(info.format).toBe("webp");
    expect([info.width, info.height]).toEqual([256, 128]);
    expect(stored.length).toBeLessThan(original.length / 2);
  });

  test("TECH-012-R1 a picture smaller than the limit is not enlarged", async () => {
    const { storePicture } = await import("./pictures");
    const info = await sharp(await readStored(await storePicture(8, await picture(100, 60)))).metadata();
    expect([info.width, info.height]).toEqual([100, 60]);
  });

  test("TECH-012-R2 a picture is turned upright by its orientation and holds no EXIF data or GPS position", async () => {
    const { storePicture } = await import("./pictures");
    const tagged = await sharp(await picture(600, 300, "jpeg"))
      .withMetadata({ orientation: 6, exif: { IFD3: { GPSLatitudeRef: "N", GPSLatitude: "59/1 19/1 0/1" } } })
      .toBuffer();
    const before = await sharp(tagged).metadata();
    expect(before.orientation).toBe(6);
    expect(before.exif).toBeDefined();
    const info = await sharp(await readStored(await storePicture(9, tagged))).metadata();
    // Wide picture turned a quarter turn: now tall
    expect([info.width, info.height]).toEqual([128, 256]);
    expect(info.exif).toBeUndefined();
    expect(info.orientation).toBeUndefined();
  });

  test("TECH-012-R3 a file that cannot be decoded is refused with BadPictureError and nothing is stored", async () => {
    const { BadPictureError, storePicture } = await import("./pictures");
    const png = await picture(50, 50);
    const before = readdirSync(dir).length;
    // A picture's signature with broken contents, and a picture cut off halfway
    for (const bytes of [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]), png.subarray(0, png.length / 2)]) {
      await expect(storePicture(10, bytes)).rejects.toBeInstanceOf(BadPictureError);
    }
    expect(readdirSync(dir)).toHaveLength(before);
  });

  test("TECH-012-R3 a picture with too many pixels is refused before it is decoded", async () => {
    const { BadPictureError, storePicture } = await import("./pictures");
    await expect(storePicture(11, await picture(7200, 7200))).rejects.toBeInstanceOf(BadPictureError);
  });
});
