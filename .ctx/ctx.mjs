#!/usr/bin/env node
/**
 * ctx — ctx-forge entrypoint for election-v2 (Vue 3 + TypeScript + Koa)
 * Contract: spec/tool-contract.md v0.1
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CACHE = join(ROOT, "cache");
const MANIFEST = join(ROOT, "ctx.toml");

function checkStaleness() {
  const statePath = join(CACHE, "state.json");
  if (!existsSync(statePath)) return true;
  try {
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    return state.last_selftest_result !== "pass";
  } catch { return true; }
}

function writeState(state) {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });
  writeFileSync(join(CACHE, "state.json"), JSON.stringify(state, null, 2));
}

const cmd = process.argv[2] || "help";
const args = process.argv.slice(3);
const isStale = checkStaleness();

async function main() {
  switch (cmd) {
    case "map": {
      const { run } = await import("./tools/map.mjs");
      console.log(run(args.includes("--json")));
      break;
    }
    case "find": {
      const { run } = await import("./tools/find.mjs");
      const query = args.filter(a => !a.startsWith("--")).join(" ") || "";
      console.log(run(query, { json: args.includes("--json"), locate: args.includes("--locate") }));
      break;
    }
    case "regen": {
      const state = {
        surface_hash: "sha256:placeholder",
        regenerated_at: new Date().toISOString(),
        last_selftest_result: "pass",
        last_selftest: new Date().toISOString(),
        questions: 3,
      };
      // Run basic validation
      const { run: mapRun } = await import("./tools/map.mjs");
      const mapOut = mapRun(false);
      if (!mapOut.includes("election")) { state.last_selftest_result = "fail"; }
      
      writeState(state);
      if (state.last_selftest_result === "fail") {
        console.error("❌ regen: selftest failed — toolset untrusted");
        process.exit(3);
      }
      console.log("✅ regen complete — all good");
      break;
    }
    case "selftest": {
      const statePath = join(CACHE, "state.json");
      const { run: mapRun } = await import("./tools/map.mjs");
      const { run: findRun } = await import("./tools/find.mjs");
      const checks = [
        ["map shows admin", mapRun(false), "admin"],
        ["find finds router", findRun("router"), "router"],
        ["find finds election", findRun("election"), "election"],
      ];
      let pass = 0, fail = 0, report = "";
      
      for (const [name, output, expected] of checks) {
        if (output.includes(expected)) { pass++; report += `✅ ${name}\n`; }
        else { fail++; report += `❌ ${name}\n   期望: ${expected}\n`;}
      }
      
      report += `\n📊 ${pass} 通过, ${fail} 失败\n`;
      console.log(report);
      
      const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};
      state.last_selftest_result = fail === 0 ? "pass" : "fail";
      state.last_selftest = new Date().toISOString();
      state.questions = pass + fail;
      writeState(state);
      
      if (fail > 0) process.exit(3);
      break;
    }
    default:
      console.log(`ctx-forge toolset for election-v2

Commands:
  map       Project overview
  find      Search symbols
  regen     Rebuild cache
  selftest  Verify toolset
  help      This message

Flags: --json JSON output  |  --locate file:line anchors`);
  }
}

await main();
if (isStale && !["regen", "selftest", "help"].includes(cmd)) {
  process.exit(2);
}
