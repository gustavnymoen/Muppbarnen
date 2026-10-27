// Kontrollerar att dokumentationen följer Open Knowledge Format (OKF v0.2)
// och våra egna regler. Beskrivs i wiki/system/documentation.md.
// Körs med: npm run lint:docs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUNDLES = ["wiki", "specs"];
const START = "README.md";
const TYPES = [
  "Guide", "Manual", "Product", "Terms", "Rules", "Feature list",
  "Solution", "Verification", "Review",
];
const REQUIRED = ["type", "title", "description", "feature"];
const FEATURE_ID = /^(MUPP|TECH)-\d{3}$/;

// Frontmatter: platta rader "nyckel: värde" och listor på en rad. Mer behövs inte.
// Ett ocitat värde med ": " eller " #" är inte giltig YAML, så det räknas som fel.
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const found = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!found) return null;
    const value = found[2];
    if (value.startsWith('"')) {
      try {
        data[found[1]] = JSON.parse(value);
      } catch {
        return null;
      }
    } else if (/: | #/.test(value) || value.endsWith(":")) {
      return null;
    } else {
      data[found[1]] = value;
    }
  }
  return { data, body: text.slice(match[0].length) };
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

// Länkar utanför kodstaplar och kodtext; externa länkar och #ankare hoppas över
function localLinks(body) {
  const text = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const targets = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (target && !/^[a-z][a-z0-9+.-]*:/i.test(target)) targets.push(target);
  }
  return targets;
}

function checkIndex(rel, front, body, isRoot, problems) {
  const allowed = isRoot ? ["okf_version"] : [];
  const keys = front ? Object.keys(front.data) : [];
  if (keys.some((key) => !allowed.includes(key))) {
    problems.push(`${rel}: index.md may only have ${isRoot ? "okf_version" : "no frontmatter"}`);
  }
  if (isRoot && !front?.data.okf_version) {
    problems.push(`${rel}: bundle root index.md needs okf_version`);
  }
  let headings = 0;
  let entries = 0;
  for (const line of body.split("\n")) {
    if (!line.trim()) continue;
    if (/^#{1,6} \S/.test(line)) headings++;
    else if (/^\* \[[^\]]+\]\([^)]+\) - \S/.test(line)) entries++;
    else problems.push(`${rel}: "${line.slice(0, 40)}" is not a heading or "* [Title](link) - description"`);
  }
  if (!headings || !entries) problems.push(`${rel}: index.md needs a heading and at least one entry`);
}

function checkLog(rel, body, problems) {
  const lines = body.split("\n").filter((line) => line.trim());
  if (!/^# \S/.test(lines[0] ?? "")) problems.push(`${rel}: log.md must start with a "# Title"`);
  let previous = null;
  for (const line of lines.slice(1)) {
    const date = line.match(/^## (\d{4}-\d{2}-\d{2})$/);
    if (date) {
      if (previous && date[1] > previous) problems.push(`${rel}: ${date[1]} must come before ${previous} (newest first)`);
      previous = date[1];
    } else if (/^## /.test(line)) {
      problems.push(`${rel}: heading "${line}" is not "## YYYY-MM-DD"`);
    } else if (!/^\* \S/.test(line)) {
      problems.push(`${rel}: "${line.slice(0, 40)}" is not a bullet`);
    } else if (!previous) {
      problems.push(`${rel}: a bullet before the first date heading`);
    }
  }
}

function checkConcept(rel, front, problems) {
  if (!front) {
    problems.push(`${rel}: missing or unreadable frontmatter`);
    return;
  }
  for (const key of REQUIRED) {
    if (!front.data[key]) problems.push(`${rel}: frontmatter needs "${key}"`);
  }
  const { type, feature } = front.data;
  if (type && !TYPES.includes(type)) problems.push(`${rel}: unknown type "${type}" (${TYPES.join(", ")})`);
  if (feature && !FEATURE_ID.test(feature)) problems.push(`${rel}: feature "${feature}" is not an ID like MUPP-007 or TECH-004`);
}

// Returnerar en lista med fynd; tom lista betyder att allt stämmer.
export function lintDocs(root) {
  const problems = [];
  const files = BUNDLES.flatMap((bundle) => markdownFiles(path.join(root, bundle)));
  const rels = new Map(files.map((file) => [file, path.relative(root, file)]));
  const links = new Map();

  for (const file of files) {
    const rel = rels.get(file);
    const text = fs.readFileSync(file, "utf8");
    const front = parseFrontmatter(text);
    const body = front ? front.body : text;
    const name = path.basename(file);
    const isRoot = BUNDLES.includes(path.dirname(rel));
    if (name === "index.md") checkIndex(rel, front, body, isRoot, problems);
    else if (name === "log.md") checkLog(rel, body, problems);
    else checkConcept(rel, front, problems);
    links.set(file, localLinks(body));
  }

  const startFile = path.join(root, START);
  if (fs.existsSync(startFile)) {
    links.set(startFile, localLinks(fs.readFileSync(startFile, "utf8")));
  } else {
    problems.push(`${START}: missing, the starting point of the documentation`);
  }

  // Länkar som pekar på något som inte finns
  const resolved = new Map();
  for (const [file, targets] of links) {
    const found = [];
    for (const target of targets) {
      const full = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(full)) {
        problems.push(`${path.relative(root, file)}: broken link ${target}`);
      } else {
        found.push(fs.statSync(full).isDirectory() ? path.join(full, "index.md") : full);
      }
    }
    resolved.set(file, found);
  }

  // Alla sidor ska gå att nå från README.md
  const reached = new Set([startFile]);
  const queue = [startFile];
  while (queue.length) {
    for (const next of resolved.get(queue.pop()) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  for (const file of files) {
    if (!reached.has(file)) problems.push(`${rels.get(file)}: not reachable from ${START} by links`);
  }

  // Varje kortmapp i specs/ ska länkas från wikin
  const specsDir = path.join(root, "specs");
  const linkedFromWiki = new Set();
  for (const [file, found] of resolved) {
    if (!file.startsWith(path.join(root, "wiki") + path.sep)) continue;
    for (const target of found) {
      const inside = path.relative(specsDir, target);
      if (!inside.startsWith("..")) linkedFromWiki.add(inside.split(path.sep)[0]);
    }
  }
  if (fs.existsSync(specsDir)) {
    for (const entry of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith("_") && !linkedFromWiki.has(entry.name)) {
        problems.push(`specs/${entry.name}: no page in the wiki links to it`);
      }
    }
  }

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = lintDocs(process.cwd());
  for (const problem of problems) console.error(problem);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in the documentation.`);
    process.exit(1);
  }
  console.log("Documentation OK.");
}
