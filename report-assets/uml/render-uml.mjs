/**
 * Render all MuGate UML Mermaid sources to SVG + PDF via @mermaid-js/mermaid-cli.
 * Usage: node render-uml.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgDir = path.join(__dirname, "svg");
const pdfDir = path.join(__dirname, "pdf");

fs.mkdirSync(svgDir, { recursive: true });
fs.mkdirSync(pdfDir, { recursive: true });

const sources = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".mmd"))
  .sort();

if (sources.length === 0) {
  console.error("No .mmd files found");
  process.exit(1);
}

const results = [];

for (const file of sources) {
  const input = path.join(__dirname, file);
  const base = file.replace(/\.mmd$/, "");
  const svgOut = path.join(svgDir, `${base}.svg`);
  const pdfOut = path.join(pdfDir, `${base}.pdf`);

  for (const [out, fmt] of [
    [svgOut, "svg"],
    [pdfOut, "pdf"],
  ]) {
    console.log(`Rendering ${file} → ${fmt}…`);
    const r = spawnSync(
      "npx",
      ["-y", "@mermaid-js/mermaid-cli@11", "-i", input, "-o", out, "-b", "transparent"],
      { stdio: "inherit", shell: true, cwd: __dirname }
    );
    results.push({ file, fmt, ok: r.status === 0, out });
    if (r.status !== 0) {
      console.error(`Failed: ${file} (${fmt}) exit=${r.status}`);
    }
  }
}

const ok = results.filter((r) => r.ok).length;
console.log(`\nDone: ${ok}/${results.length} renders succeeded`);
for (const r of results) {
  console.log(`  [${r.ok ? "OK" : "FAIL"}] ${r.fmt}: ${r.out}`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
