#!/usr/bin/env node
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const CTX_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT_DIR = dirname(CTX_DIR);

const packages = [
  ["admin", "后台管理端 (Vue3 + Vite + Element Plus)"],
  ["koaLite", "后端 API (Koa + MySQL)"],
  ["vue-cli-lazy", "旧前端参考"],
  ["frontend_wx", "旧小程序参考"],
  ["mini-program", "当前小程序线索"],
];

export function run(jsonMode = false) {
  const entries = packages.map(([dir, description]) => {
    const pkgPath = join(ROOT_DIR, dir, "package.json");
    const pkg = readJson(pkgPath);
    return {
      name: dir,
      description,
      version: pkg.version || "?",
      entrypoints: getEntrypoints(dir, pkg),
      deps: pkg.dependencies ? Object.keys(pkg.dependencies).length : 0,
      devDeps: pkg.devDependencies ? Object.keys(pkg.devDependencies).length : 0,
    };
  });

  if (jsonMode) return JSON.stringify(entries, null, 2);

  let out = "";
  for (const e of entries) {
    out += `📦 ${e.name}  v${e.version}\n`;
    out += `   ${e.description}\n`;
    out += `   入口: ${e.entrypoints.join(", ") || "—"}\n`;
    out += `   依赖: ${e.deps} 生产 / ${e.devDeps} 开发\n\n`;
  }
  return out;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { return {}; }
}

function getEntrypoints(dir, pkg) {
  const pts = [];
  if (pkg.main) pts.push(pkg.main);
  if (existsSync(join(ROOT_DIR, dir, "src", "main.ts"))) pts.push("src/main.ts");
  if (existsSync(join(ROOT_DIR, dir, "src", "main.js"))) pts.push("src/main.js");
  if (existsSync(join(ROOT_DIR, dir, "app.js"))) pts.push("app.js");
  if (existsSync(join(ROOT_DIR, dir, "app.json"))) pts.push("app.json");
  return pts.length ? pts : ["(no entrypoints detected)"];
}
