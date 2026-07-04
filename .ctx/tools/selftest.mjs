#!/usr/bin/env node
/**
 * ctx selftest — verify ctx toolset against golden questions
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

export function run() {
  const goldenPath = join(ROOT, "golden.yaml");
  let results = { pass: 0, fail: 0, report: "" };
  
  if (!existsSync(goldenPath)) {
    results.report = "⚠️  未找到 golden.yaml，跳过验证\n";
    results.pass = 1;
    return results;
  }
  
  // Parse and run golden questions
  const content = readFileSync(goldenPath, "utf8");
  const questions = parseGolden(content);
  
  for (const q of questions) {
    try {
      const { run: commandFn } = await import(`./tools/${q.command}.mjs`);
      const output = commandFn(q.query);
      const pass = output.includes(q.expect);
      
      if (pass) {
        results.pass++;
        results.report += `✅ ${q.name}\n`;
      } else {
        results.fail++;
        results.report += `❌ ${q.name}\n   期望: ${q.expect}\n   实际: ${output.substring(0, 200)}\n`;
      }
    } catch (err) {
      results.fail++;
      results.report += `❌ ${q.name} (错误: ${err.message})\n`;
    }
  }
  
  results.report += `\n📊 结果: ${results.pass} 通过, ${results.fail} 失败\n`;
  return results;
}

function parseGolden(content) {
  const questions = [];
  const lines = content.split("\n");
  let current = null;
  
  for (const line of lines) {
    if (line.startsWith("- name:")) {
      if (current) questions.push(current);
      current = { name: line.replace("- name:", "").trim() };
    } else if (current && line.startsWith("  command:")) {
      current.command = line.replace("command:", "").trim();
    } else if (current && line.startsWith("  query:")) {
      current.query = line.replace("query:", "").trim();
    } else if (current && line.startsWith("  expect:")) {
      current.expect = line.replace("expect:", "").trim();
    }
  }
  if (current) questions.push(current);
  return questions;
}
