import { describe, expect, test } from "vitest";
import { detectImageType, imageTypeOf, MAX_IMAGE_BYTES } from "./image-type";

const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0]);

describe("MUPP-003-R6 the picture type is decided by the content", () => {
  test("MUPP-003-R6 JPEG, PNG and WebP are recognised", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectImageType(webp)).toBe("image/webp");
  });

  test("MUPP-003-R6 a text file renamed to .jpg, an SVG, a GIF, an empty file and a RIFF file that is not WebP are refused", () => {
    const encode = (text: string) => new TextEncoder().encode(text);
    expect(detectImageType(encode("detta är bara text"))).toBeNull();
    expect(detectImageType(encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(detectImageType(encode("GIF89a\u0001\u0000"))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]))).toBeNull();
  });

  test("MUPP-003-R6 the limit is 4 MB and a stored name gives its type back", () => {
    expect(MAX_IMAGE_BYTES).toBe(4 * 1024 * 1024);
    expect(imageTypeOf("barn-1-x.jpg")).toBe("image/jpeg");
    expect(imageTypeOf("barn-1-x.png")).toBe("image/png");
    expect(imageTypeOf("barn-1-x.webp")).toBe("image/webp");
    expect(imageTypeOf("barn-1-x.svg")).toBeNull();
  });
});
