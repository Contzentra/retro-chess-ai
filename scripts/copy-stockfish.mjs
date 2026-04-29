import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "node_modules", "stockfish", "bin");
const dstDir = path.join(root, "public", "engine");

// Use the lite single build: much smaller + faster startup in the browser.
const mappings = [
  { src: "stockfish-18-lite-single.js", dst: "stockfish.js" },
  { src: "stockfish-18-lite-single.wasm", dst: "stockfish.wasm" },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyAlways(srcFile, dstFile) {
  const src = path.join(srcDir, srcFile);
  const dst = path.join(dstDir, dstFile);

  if (!fs.existsSync(src)) {
    console.warn(`[copy-stockfish] missing source: ${src}`);
    return;
  }

  fs.copyFileSync(src, dst);
  console.log(`[copy-stockfish] copied ${srcFile} -> public/engine/${dstFile}`);
}

ensureDir(dstDir);
for (const m of mappings) copyAlways(m.src, m.dst);
