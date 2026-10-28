import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

// Kontrollen som fångar en bortglömd inloggningskontroll (TECH-005-R1) och
// reglerna i specs/rules.md som går att läsa ur koden: varje rutt (app/**/route.ts)
// och varje serveråtgärd ("use server") kontrollerar inloggningen först, skrivande
// anrop går genom gränsen och Origin-kontrollen (guardWrite), adminsidor kontrollerar
// också adminkakan, och bildlagret skapas privat. Läser koden som text, utan att köra den.

const root = path.resolve(import.meta.dirname, "..");

// Det enda som får sakna inloggningskontrollen, med skälet
const NO_SIGN_IN_CHECK: Record<string, string> = {
  "app/losenord/actions.ts#login": "den är själva inloggningen; den har gränsen och spärren i stället",
};

// Det enda under admin som får sakna adminkontrollen, med skälet
const NO_ADMIN_CHECK: Record<string, string> = {
  "app/admin/login-action.ts#adminLogin": "den är själva adminanmälan; den har gränsen och spärren i stället",
};

// Antingen requireSiteSession(), eller hasSiteSession() som nekas med ! (eller sparas i en variabel)
const SITE_CHECK = /^(?:(?:await\s+)?requireSiteSession\(|const\s+\w+\s*=\s*await\s+hasSiteSession\(|if\s*\(\s*!\s*\(?\s*(?:await\s+)?hasSiteSession\()/;
const ADMIN_CHECK = /(?:hasAdminSession|requireAdminSession)\(/;
const HTTP_METHODS = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/;
const WRITE_METHODS = /^(POST|PUT|PATCH|DELETE)$/;

type Source = { file: string; text: string };

const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// Texten mellan { och dess slutklammer
function blockAfter(text: string, open: number) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  return text.slice(open + 1);
}

// Platsen för ) som stänger parentesen som öppnas strax före `from`
function closingParen(text: string, from: number) {
  let depth = 1;
  for (let i = from; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

// Exporterade funktioner med sina kroppar. Parameterlistan hoppas över, så att
// { params } i den inte tas för kroppen.
function exportedFunctions(text: string) {
  const found: { name: string; body: string }[] = [];
  const declarations = /export\s+(?:async\s+)?function\s+(\w+)\s*\(|export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  for (const match of text.matchAll(declarations)) {
    const end = closingParen(text, match.index + match[0].length);
    const open = end === -1 ? -1 : text.indexOf("{", end);
    if (open !== -1) found.push({ name: match[1] ?? match[2], body: blockAfter(text, open) });
  }
  return found;
}

// Namnen på allt som exporteras som värde (inte typer) och inte är en känd funktion
// kontrolleras separat: en export av ett annat slag (export const POST = withAuth(…),
// export { handler as POST }) ses inte av kontrollen och får därför inte finnas.
function unknownExports(text: string, known: string[]) {
  const names = [...text.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/g)].map((m) => m[1]);
  const listed = [...text.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) => m[1].split(",").map((part) => part.trim().split(/\s+as\s+/).pop()!));
  if (/export\s+default\b/.test(text)) names.push("default");
  return [...names, ...listed].filter((name) => name && !known.includes(name));
}

// Alla problem i de givna filerna, som "fil: vad som är fel"
function findProblems(sources: Source[]) {
  const problems: string[] = [];
  for (const { file, text: raw } of sources) {
    const text = withoutComments(raw);
    const isRoute = /(^|\/)route\.[mc]?[jt]sx?$/.test(file);
    const isAction = /^\s*["']use server["']/.test(text);

    if (!isAction && /["']use server["']/.test(text)) {
      problems.push(`${file}: "use server" inne i en fil; lägg serveråtgärder i en egen fil som börjar med "use server"`);
    }
    if (/@vercel\/blob/.test(text) && /\bput\(/.test(text) && !/access:\s*["']private["']/.test(text)) {
      problems.push(`${file}: bilder läggs i Vercel Blob utan access: "private"`);
    }
    if (!isRoute && !isAction) continue;

    const functions = exportedFunctions(text);
    // I en rutt gäller det bara HTTP-metoderna (resten, som `dynamic`, är inställningar)
    for (const name of unknownExports(text, functions.map((f) => f.name))) {
      if (isAction || (isRoute && HTTP_METHODS.test(name))) {
        problems.push(`${file}#${name}: exporteras på ett sätt som kontrollen inte ser; skriv det som export async function ${name}(…) { … }`);
      }
    }
    for (const { name, body } of functions) {
      if (isRoute && !HTTP_METHODS.test(name)) continue;
      const id = `${file}#${name}`;
      const first = body.trim();
      if (!(id in NO_SIGN_IN_CHECK) && !SITE_CHECK.test(first)) {
        problems.push(`${id}: anropar inte hasSiteSession() eller requireSiteSession() först`);
      }
      if (/(^|\/)admin(\/|$)/.test(file) && !(id in NO_ADMIN_CHECK) && !ADMIN_CHECK.test(first.slice(0, 300))) {
        problems.push(`${id}: ligger under admin men kontrollerar inte adminkakan (hasAdminSession/requireAdminSession) direkt efter`);
      }
      if ((isAction || WRITE_METHODS.test(name)) && !/\bguardWrite\(/.test(body)) {
        problems.push(`${id}: skriver men går inte genom guardWrite() (gränsen för skrivande anrop och Origin)`);
      }
    }
  }
  return problems;
}

// Allt i projektet utom det som inte är kod för sajten, så att en fil i en ny mapp inte missas
const SKIPPED = new Set(["node_modules", "test-results", "playwright", "wiki", "specs", "db", "scripts", "tests"]);
function sourcesUnder(dir: string): Source[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return entry.name.startsWith(".") || (!dir && SKIPPED.has(entry.name)) ? [] : sourcesUnder(file);
    return /\.[mc]?[jt]sx?$/.test(entry.name) && !entry.name.includes(".test.") ? [{ file, text: readFileSync(path.join(root, file), "utf8") }] : [];
  });
}

const good = `
import { hasSiteSession } from "@/lib/site-auth";
import { guardWrite } from "@/lib/request-guard";
export async function POST() {
  if (!(await hasSiteSession())) return new Response(null, { status: 401 });
  if ((await guardWrite()) !== "ok") return new Response(null, { status: 429 });
  return Response.json({});
}
export async function GET() {
  // en kommentar före kontrollen
  if (!(await hasSiteSession())) return new Response(null, { status: 401 });
  return Response.json({});
}`;

describe("TECH-005-R1 every route and server action checks the sign-in first", () => {
  test("TECH-005-R1 the site's own code passes, and the check finds the files it should", () => {
    const sources = sourcesUnder("");
    expect(sources.some((s) => s.file === "app/losenord/actions.ts")).toBe(true);
    expect(findProblems(sources)).toEqual([]);
    // Undantagen finns kvar; ett som inte längre behövs ska tas bort
    const ids = sources.flatMap(({ file, text }) => exportedFunctions(withoutComments(text)).map((f) => `${file}#${f.name}`));
    for (const id of [...Object.keys(NO_SIGN_IN_CHECK), ...Object.keys(NO_ADMIN_CHECK)]) expect(ids, id).toContain(id);
  });

  test("TECH-005-R1 a route with the check passes", () => {
    expect(findProblems([{ file: "app/api/barn/route.ts", text: good }])).toEqual([]);
  });

  test("TECH-005-R1 a route without the check fails and the message names the file", () => {
    const text = good.replace("if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n  if ((await guardWrite())", "if ((await guardWrite())");
    expect(findProblems([{ file: "app/api/barn/route.ts", text }])).toEqual([
      "app/api/barn/route.ts#POST: anropar inte hasSiteSession() eller requireSiteSession() först",
    ]);
  });

  test("TECH-005-R1 a check that comes after other work fails", () => {
    const text = `export async function GET() {\n  const rows = await all("SELECT 1");\n  if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n  return Response.json(rows);\n}`;
    expect(findProblems([{ file: "app/api/x/route.ts", text }])).toHaveLength(1);
  });

  test("TECH-005-R1 a server action without the check fails, with it passes", () => {
    const bad = `"use server";\nexport async function save(data: FormData) {\n  await guardWrite();\n}`;
    expect(findProblems([{ file: "app/onskelista/actions.ts", text: bad }])).toEqual([
      "app/onskelista/actions.ts#save: anropar inte hasSiteSession() eller requireSiteSession() först",
    ]);
    const ok = `"use server";\nexport const save = async (data: FormData) => {\n  await requireSiteSession();\n  await guardWrite();\n};`;
    expect(findProblems([{ file: "app/onskelista/actions.ts", text: ok }])).toEqual([]);
  });

  test("TECH-005-R1 the login action is the one listed exception", () => {
    expect(Object.keys(NO_SIGN_IN_CHECK)).toEqual(["app/losenord/actions.ts#login"]);
    const text = `"use server";\nexport async function login() {\n  await guardWrite();\n}`;
    expect(findProblems([{ file: "app/losenord/actions.ts", text }])).toEqual([]);
    expect(findProblems([{ file: "app/annat/actions.ts", text }])).toHaveLength(1);
  });

  test("MUPP-003-R1 the admin sign-in is the one listed exception from the admin check, and still needs the site cookie", () => {
    expect(Object.keys(NO_ADMIN_CHECK)).toEqual(["app/admin/login-action.ts#adminLogin"]);
    const text = `"use server";\nexport async function adminLogin() {\n  await requireSiteSession();\n  await guardWrite();\n}`;
    expect(findProblems([{ file: "app/admin/login-action.ts", text }])).toEqual([]);
    expect(findProblems([{ file: "app/admin/andra.ts", text }])[0]).toContain("adminkakan");
    expect(findProblems([{ file: "app/admin/login-action.ts", text: text.replace("await requireSiteSession();\n  ", "") }])).toHaveLength(1);
  });

  test("TECH-005-R1 an inline server action inside a component fails", () => {
    const text = `export default function Page() {\n  async function save() {\n    "use server";\n  }\n  return null;\n}`;
    expect(findProblems([{ file: "app/x/page.tsx", text }])[0]).toContain("app/x/page.tsx");
  });
});

describe("TECH-005-R2 R4 the other rules that can be read from the code", () => {
  test("TECH-005-R2 a writing route or action that skips guardWrite fails, a GET does not need it", () => {
    const text = `export async function POST() {\n  if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n  return Response.json({});\n}\nexport async function GET() {\n  if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n  return Response.json({});\n}`;
    expect(findProblems([{ file: "app/api/x/route.ts", text }])).toEqual([
      "app/api/x/route.ts#POST: skriver men går inte genom guardWrite() (gränsen för skrivande anrop och Origin)",
    ]);
  });

  test("TECH-005-R1 an admin route must also check the admin cookie", () => {
    const text = `export async function POST() {\n  if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n  await guardWrite();\n}`;
    expect(findProblems([{ file: "app/admin/actions.ts", text: `"use server";\n` + text.replace("POST", "save") }])[0]).toContain("adminkakan");
    const ok = text.replace("await guardWrite();", "if (!(await hasAdminSession())) return new Response(null, { status: 401 });\n  await guardWrite();");
    expect(findProblems([{ file: "app/api/admin/route.ts", text: ok }])).toEqual([]);
  });

  test("TECH-005-R4 the picture store is private: put() needs access private", () => {
    const bad = `import { put } from "@vercel/blob";\nawait put("a.jpg", file, { access: "public" });`;
    expect(findProblems([{ file: "lib/bilder.ts", text: bad }])).toEqual(['lib/bilder.ts: bilder läggs i Vercel Blob utan access: "private"']);
    expect(findProblems([{ file: "lib/bilder.ts", text: bad.replace("public", "private") }])).toEqual([]);
  });

  test("TECH-005-R1 an export the check can't read fails instead of passing unseen", () => {
    for (const exported of ["export const POST = withAuth(handler);", "export { handler as POST };", "export const GET = async function () {};"]) {
      expect(findProblems([{ file: "app/api/x/route.ts", text: exported }]), exported).toHaveLength(1);
    }
    expect(findProblems([{ file: "app/api/x/route.ts", text: "export const dynamic = 'force-dynamic';" }])).toEqual([]);
  });

  test("TECH-005-R1 a handler with { params } in its parameters is read correctly, and a check with the wrong polarity fails", () => {
    const withParams = `export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {\n  if (!(await hasSiteSession())) return new Response(null, { status: 401 });\n}`;
    expect(findProblems([{ file: "app/api/x/route.ts", text: withParams }])).toEqual([]);
    const wrong = withParams.replace("!(await", "(await");
    expect(findProblems([{ file: "app/api/x/route.ts", text: wrong }])).toHaveLength(1);
  });
});
