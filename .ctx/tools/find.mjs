#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const CTX_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT_DIR = dirname(CTX_DIR);
const SEARCH_DIRS = ["admin/src", "koaLite", "vue-cli-lazy/src", "frontend_wx", "mini-program"];

export function run(query, opts = {}) {
  const results = [];
  const q = String(query || "").toLowerCase();

  for (const dir of SEARCH_DIRS) {
    const root = join(ROOT_DIR, dir);
    if (existsSync(root)) searchDir(root, q, results);
  }

  const seen = new Set();
  const uniq = results.filter((r) => {
    const key = `${r.file}:${r.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (opts.json) return JSON.stringify(uniq, null, 2);
  if (opts.locate) return uniq.map((r) => `${r.file}:${r.line}:${r.match}`).join("\n");

  let out = "";
  for (const r of uniq.slice(0, 30)) {
    out += `  📍 ${r.file}:${r.line}\n     ${r.match.trim()}\n\n`;
  }
  if (uniq.length > 30) out += `  ... 还有 ${uniq.length - 30} 处\n`;
  return out || "No matches\n";
}

function searchDir(dirPath, query, results) {
  for (const entry of safeReadDir(dirPath)) {
    const fullPath = join(dirPath, entry);
    const stat = safeStat(fullPath);
    if (!stat) continue;
    if (stat.isDirectory()) {
      if (["node_modules", "dist", ".git", "cache"].includes(entry)) continue;
      searchDir(fullPath, query, results);
      continue;
    }
    if (!/\.(ts|vue|js|json)$/.test(entry)) continue;

    const content = safeRead(fullPath);
    if (!content) continue;
    content.split("\n").forEach((line, index) => {
      if (line.toLowerCase().includes(query)) {
        results.push({
          file: fullPath.replace(ROOT_DIR + "\\", "").replace(/\\/g, "/"),
          line: index + 1,
          match: line.trim().substring(0, 120),
        });
      }
    });
  }
}

function safeReadDir(path) {
  try { return readdirSync(path); }
  catch { return []; }
}

function safeStat(path) {
  try { return statSync(path); }
  catch { return null; }
}

function safeRead(path) {
  try { return readFileSync(path, "utf8"); }
  catch { return ""; }
}
