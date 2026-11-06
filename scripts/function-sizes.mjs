// Efter en build: summerar filerna som varje funktion spårar (.nft.json) och felar om en är för stor (TECH-016).
// Körs mot en build med VERCEL=1, se wiki/system/testing.md. Användning: node scripts/function-sizes.mjs [distDir]
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

const MB = 1_000_000;
const DEFAULT_LIMIT = 6 * MB;
// Bara /admin/hantera laddar upp bilder och får ha med sharp (ca 19 MB)
const LIMITS = { "app/admin/hantera/page": 25 * MB };
const SHARP = /node_modules\/(?:@img|sharp)\//;
const NATIVE_LIBSQL = /node_modules\/(?:libsql|@libsql\/(?:darwin|linux|win32)-[a-z0-9-]+)\//;

const server = path.join(path.resolve(process.argv[2] ?? ".next"), "server");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const problems = [];
const rows = [];
for (const trace of walk(server).filter((f) => f.endsWith(".nft.json"))) {
  const name = path.relative(server, trace).replace(/(?:\.js)?\.nft\.json$/, "");
  // realpath: pnpm/npm kan länka, och samma fil ska bara räknas en gång
  const files = new Set(
    JSON.parse(readFileSync(trace, "utf8")).files.map((f) => {
      try {
        return realpathSync(path.resolve(path.dirname(trace), f));
      } catch {
        return null; // filen finns inte (längre), den tar ingen plats
      }
    }).filter(Boolean),
  );
  let total = 0;
  for (const f of files) total += statSync(f).size;
  const limit = LIMITS[name] ?? DEFAULT_LIMIT;
  rows.push(`${(total / MB).toFixed(1).padStart(5)} MB (gräns ${limit / MB})  ${name}`);
  if (total > limit) problems.push(`${name}: ${(total / MB).toFixed(1)} MB, över gränsen ${limit / MB} MB`);
  const list = [...files];
  if (list.some((f) => NATIVE_LIBSQL.test(f))) problems.push(`${name}: spårar den inbyggda libsql (bygg med VERCEL=1)`);
  if (name !== "app/admin/hantera/page" && list.some((f) => SHARP.test(f))) problems.push(`${name}: spårar sharp, bara /admin/hantera ska göra det`);
}

if (rows.length === 0) {
  console.error(`Inga .nft.json-filer under ${server}. Kör en build först.`);
  process.exit(1);
}
console.log(rows.sort().join("\n"));
if (problems.length > 0) {
  console.error(`\n${problems.join("\n")}`);
  process.exit(1);
}
