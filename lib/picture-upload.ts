import "server-only";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { picturesDir, storedInBlob } from "./pictures";

// Att krympa och spara en uppladdad bild (TECH-012). Ligger för sig för att sharp är stort (ca 19 MB):
// bara funktionen för /admin/hantera, där bilden laddas upp, ska få med det (TECH-016).

// Störst sida i pixlar (TECH-012-R1): största avataren är 104 px, dubbelt för 2x-skärmar och lite till
const MAX_PICTURE_SIDE = 256;
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
