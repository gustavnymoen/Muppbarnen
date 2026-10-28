import "server-only";
import { del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { localDataDir } from "./local-db.mjs";
import { IMAGE_EXTENSIONS, imageTypeOf, type ImageType } from "./image-type";

// Barnens bilder (MUPP-003-R6). På Vercel ligger de i ett privat Blob-lager och nås bara
// genom sajten (app/bilder/[id]/route.ts). Utan BLOB_READ_WRITE_TOKEN, lokalt och i testerna,
// ligger de i en mapp (PICTURES_DIR, annars bredvid databasen) bakom samma tre funktioner.
// Namnet som sparas på barnet är bara filnamnet, aldrig en adress.

const storedInBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const picturesDir = () => process.env.PICTURES_DIR ?? path.join(localDataDir, "pictures");
// Det enda namnen kan se ut som; skyddar mot att ett konstigt värde i databasen når utanför mappen
const NAME = /^barn-\d{1,15}-[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

// Sparar bilden och ger namnet att lägga på barnet
export async function storePicture(childId: number, bytes: Uint8Array, type: ImageType) {
  const name = `barn-${childId}-${randomUUID()}.${IMAGE_EXTENSIONS[type]}`;
  if (storedInBlob()) {
    await put(name, Buffer.from(bytes), { access: "private", contentType: type, addRandomSuffix: false });
  } else {
    await mkdir(picturesDir(), { recursive: true });
    await writeFile(path.join(picturesDir(), name), bytes);
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
