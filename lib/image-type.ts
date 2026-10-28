// Vilken sorts bild en fil är, avgjort av filens innehåll (de första byten) och inte av
// namnet eller den typ webbläsaren uppger. Ren kod, så att den går att enhetstesta.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type ImageType = keyof typeof IMAGE_EXTENSIONS;

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((b, i) => bytes[offset + i] === b);

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF", fyra byte längd, "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

// Typen ur ett sparat filnamns ändelse
export function imageTypeOf(name: string): ImageType | null {
  const extension = name.split(".").pop();
  return (Object.keys(IMAGE_EXTENSIONS) as ImageType[]).find((type) => IMAGE_EXTENSIONS[type] === extension) ?? null;
}
