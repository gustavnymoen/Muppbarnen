import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { lintDocs } from "./lint-docs.mjs";

const concept = (type = "Guide", extra = "") =>
  `---\ntype: ${type}\ntitle: Sida\ndescription: En sida.\nfeature: TECH-004\n${extra}---\n\n# Sida\n`;

const folders: string[] = [];

// En liten giltig dokumentation att utgå från; varje test ändrar en sak
function makeDocs(files: Record<string, string> = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lint-docs-"));
  folders.push(root);
  const all: Record<string, string> = {
    "README.md": "[Wiki](wiki/) och [Specs](specs/)\n",
    "wiki/index.md": '---\nokf_version: "0.2"\n---\n\n# Wiki\n\n* [Sida](page.md) - En sida.\n* [Logg](log.md) - Loggen.\n',
    "wiki/page.md": concept("Guide") + "[Kort](../specs/TECH-004-x/solution.md)\n",
    "wiki/log.md": "# Log\n\n## 2026-10-27\n\n* Ny sida.\n\n## 2026-10-26\n\n* Äldre.\n",
    "specs/index.md": '---\nokf_version: "0.2"\n---\n\n# Specs\n\n* [Lösning](TECH-004-x/solution.md) - Lösningen.\n',
    "specs/TECH-004-x/solution.md": concept("Solution"),
    ...files,
  };
  for (const [rel, text] of Object.entries(all)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  return root;
}

afterEach(() => {
  for (const folder of folders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe("lint:docs", () => {
  test("TECH-004-R2 R3 godkänner giltig dokumentation", () => {
    expect(lintDocs(makeDocs())).toEqual([]);
  });

  test("TECH-004-R2 kräver type i frontmatter", () => {
    const root = makeDocs({ "wiki/page.md": concept("Guide").replace("type: Guide\n", "") });
    expect(lintDocs(root)).toContainEqual(expect.stringContaining('wiki/page.md: frontmatter needs "type"'));
  });

  test("TECH-004-R2 kräver ett riktigt feature-ID och en känd type", () => {
    const root = makeDocs({ "wiki/page.md": concept("Okänd").replace("TECH-004", "setup") });
    const problems = lintDocs(root).join("\n");
    expect(problems).toContain('unknown type "Okänd"');
    expect(problems).toContain('feature "setup" is not an ID');
  });

  test("TECH-004-R2 tillåter bara okf_version i frontmatter på index.md", () => {
    const root = makeDocs({ "wiki/index.md": "---\ntitle: Wiki\n---\n\n# Wiki\n\n* [Sida](page.md) - En sida.\n* [Logg](log.md) - Loggen.\n" });
    expect(lintDocs(root)).toContainEqual(expect.stringContaining("index.md may only have"));
  });

  test("TECH-004-R2 kräver okf_version i roten även utan frontmatter", () => {
    const root = makeDocs({ "wiki/index.md": "# Wiki\n\n* [Sida](page.md) - En sida.\n* [Logg](log.md) - Loggen.\n" });
    expect(lintDocs(root)).toContainEqual(expect.stringContaining("needs okf_version"));
  });

  test("TECH-004-R2 underkänner frontmatter som inte är giltig YAML", () => {
    const root = makeDocs({ "wiki/page.md": concept("Guide").replace("title: Sida", "title: TECH-004 Sida: lösning") });
    expect(lintDocs(root)).toContainEqual("wiki/page.md: missing or unreadable frontmatter");
  });

  test("TECH-004-R2 godkänner citerade värden med kolon", () => {
    const root = makeDocs({ "wiki/page.md": concept("Guide").replace("title: Sida", 'title: "TECH-004 Sida: lösning"') + "[Kort](../specs/TECH-004-x/solution.md)\n" });
    expect(lintDocs(root)).toEqual([]);
  });

  test("TECH-004-R2 kräver rätt form på posterna i index.md", () => {
    const root = makeDocs({ "wiki/index.md": '---\nokf_version: "0.2"\n---\n\n# Wiki\n\n* [Sida](page.md)\n* [Logg](log.md) - Loggen.\n' });
    expect(lintDocs(root)).toContainEqual(expect.stringContaining("is not a heading or"));
  });

  test("TECH-004-R2 kräver datumrubriker med nyast först i log.md", () => {
    const root = makeDocs({ "wiki/log.md": "# Log\n\n## 2026-10-26\n\n* Äldre.\n\n## 2026-10-27\n\n* Nyare.\n\n## Igår\n" });
    const problems = lintDocs(root).join("\n");
    expect(problems).toContain("2026-10-27 must come before 2026-10-26");
    expect(problems).toContain('"## Igår" is not "## YYYY-MM-DD"');
  });

  test("TECH-004-R3 hittar trasiga länkar", () => {
    const root = makeDocs({ "wiki/page.md": concept("Guide") + "[Borta](missing.md) och [Kort](../specs/TECH-004-x/solution.md)\n" });
    expect(lintDocs(root)).toContainEqual("wiki/page.md: broken link missing.md");
  });

  test("TECH-004-R3 hittar sidor som inte går att nå från README.md", () => {
    const root = makeDocs({ "wiki/orphan.md": concept("Guide") });
    expect(lintDocs(root)).toContainEqual("wiki/orphan.md: not reachable from README.md by links");
  });

  test("TECH-004-R3 kräver att varje kortmapp länkas från wikin", () => {
    const root = makeDocs({
      "specs/TECH-005-y/solution.md": concept("Solution"),
      "specs/index.md": '---\nokf_version: "0.2"\n---\n\n# Specs\n\n* [A](TECH-004-x/solution.md) - A.\n* [B](TECH-005-y/solution.md) - B.\n',
    });
    expect(lintDocs(root)).toEqual(["specs/TECH-005-y: no page in the wiki links to it"]);
  });

  test("TECH-004-R3 följer länkar till mappar via deras index.md", () => {
    const root = makeDocs({ "README.md": "[Wiki](wiki/) och [Specs](specs/)\n[Mapp](wiki/extra/)\n", "wiki/extra/index.md": "# Extra\n\n* [Sida](page.md) - En sida.\n", "wiki/extra/page.md": concept("Guide") });
    expect(lintDocs(root)).toEqual([]);
  });

  test("TECH-004-R3 räknar inte länkar i kodtext", () => {
    const root = makeDocs({ "wiki/page.md": concept("Guide") + "`[Kod](missing.md)` och [Kort](../specs/TECH-004-x/solution.md)\n" });
    expect(lintDocs(root)).toEqual([]);
  });
});
