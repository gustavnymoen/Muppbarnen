import "server-only";
import { del, get } from "@vercel/blob";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { localDataDir } from "./local-db.mjs";
import { imageTypeOf, type ImageType } from "./image-type";

// Barnens bilder (MUPP-003-R6). På Vercel ligger de i ett privat Blob-lager och nås bara
// genom sajten (app/bilder/[id]/route.ts). Utan BLOB_READ_WRITE_TOKEN, lokalt och i testerna,
// ligger de i en mapp (PICTURES_DIR, annars bredvid databasen) bakom samma tre funktioner.
// Namnet som sparas på barnet är bara filnamnet, aldrig en adress.

export const storedInBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const picturesDir = () => process.env.PICTURES_DIR ?? path.join(localDataDir, "pictures");
// Det enda namnen kan se ut som; skyddar mot att ett konstigt värde i databasen når utanför mappen
const NAME = /^barn-\d{1,15}-[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

// Att lägga till en bild ligger i lib/picture-upload.ts, den enda filen som laddar sharp (TECH-016)

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
