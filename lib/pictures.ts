import "server-only";
import { del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { localDataDir } from "./local-db.mjs";
import { imageTypeOf, type ImageType } from "./image-type";

// Barnens bilder (MUPP-003-R6). På Vercel ligger de i ett privat Blob-lager och nås bara
// genom sajten (app/bilder/[id]/route.ts). Utan BLOB_READ_WRITE_TOKEN, lokalt och i testerna,
// ligger de i en mapp (PICTURES_DIR, annars bredvid databasen) bakom samma tre funktioner.
// Namnet som sparas på barnet är bara filnamnet, aldrig en adress.

const storedInBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const picturesDir = () => process.env.PICTURES_DIR ?? path.join(localDataDir, "pictures");
// Det enda namnen kan se ut som; skyddar mot att ett konstigt värde i databasen når utanför mappen
const NAME = /^barn-\d{1,15}-[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

// Störst sida i pixlar (TECH-012-R1): största avataren är 104 px, dubbelt för 2x-skärmar och lite till
export const MAX_PICTURE_SIDE = 256;
// Gräns för avkodning, så att en liten fil som blir en enorm bild (dekompressionsbomb) inte tar minnet
const MAX_INPUT_PIXELS = 50_000_000;

// Filen går inte att avkoda som en bild (TECH-012-R3)
export class BadPictureError extends Error {}

// Gör bilden liten: roterad som EXIF säger, högst MAX_PICTURE_SIDE px, WebP. sharp tar bort metadata (GPS m.m.) om man inte ber om den.
async function shrink(bytes: Uint8Array) {
  try {
    return await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(MAX_PICTURE_SIDE, MAX_PICTURE_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp()
      .toBuffer();
  } catch {
    throw new BadPictureError("Bilden kunde inte avkodas");
  }
}

// Krymper och sparar bilden och ger namnet att lägga på barnet. Kastar BadPictureError om bilden är trasig.
export async function storePicture(childId: number, bytes: Uint8Array) {
  const small = await shrink(bytes);
  const name = `barn-${childId}-${randomUUID()}.webp`;
  if (storedInBlob()) {
    await put(name, small, { access: "private", contentType: "image/webp", addRandomSuffix: false });
  } else {
    await mkdir(picturesDir(), { recursive: true });
    await writeFile(path.join(picturesDir(), name), small);
  }
  return name;
}

// Bilden och dess typ, eller null om den saknas
export async function readPicture(name: string): Promise<{ body: BodyInit; type: ImageType } | null> {
  const type = NAME.test(name) ? imageTypeOf(name) : null;
  if (!type) return null;
  if (storedInBlob()) {
    const blob = await get(name, { access: "private" });
    return blob?.statusCode === 200 ? { body: blob.stream, type } : null;
  }
  try {
    return { body: new Uint8Array(await readFile(path.join(picturesDir(), name))), type };
  } catch {
    return null;
  }
}

export async function removePicture(name: string) {
  if (!NAME.test(name)) return;
  if (storedInBlob()) await del(name);
  else await rm(path.join(picturesDir(), name), { force: true });
}
