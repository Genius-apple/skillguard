import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { SECURITY_RULES, QUALITY_RULES } from "./rules.js";
import { SEVERITY_WEIGHT, type Finding, type SkillReport } from "./types.js";

/** Recursively find skill definition files (SKILL.md or *.skill.md). */
export function findSkillFiles(dir: string): string[] {
  const root = resolve(dir);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Not a directory: ${root}`);
  }
  const results: string[] = [];
  const walk = (d: string, depth: number) => {
    if (depth > 6) return;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.name === "SKILL.md" || /(^|[-.])skill\.md$/i.test(entry.name)) results.push(full);
    }
  };
  walk(root, 0);
  return results;
}

function parseFrontmatter(text: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

function applyRules(text: string, rules: typeof SECURITY_RULES): Finding[] {
  const findings: Finding[] = [];
  for (const rule of rules) {
    // scan line by line for precise locations
    const lines = text.split(/\r?\n/);
    let matched = false;
    for (let i = 0; i < lines.length; i++) {
      const window = lines.slice(i, i + 2).join("\n"); // 2-line window for multi-line hits
      if (rule.pattern.test(lines[i]) || rule.pattern.test(window)) {
        // prefer the exact line when the match came from the 2-line window
        const exactLine = rule.pattern.test(lines[i]) ? i : i + 1;
        findings.push({
          id: rule.id,
          severity: rule.severity,
          title: rule.title,
          detail: rule.detail,
          line: exactLine + 1,
          snippet: lines[exactLine].trim().slice(0, 120),
        });
        matched = true;
        break;
      }
    }
    void matched;
  }
  return findings;
}

/** Audit a single skill file and produce a scored report. */
export function auditSkillFile(filePath: string): SkillReport {
  const text = readFileSync(filePath, "utf8");
  const fm = parseFrontmatter(text);
  const findings: Finding[] = applyRules(text, SECURITY_RULES);

  // Quality checks
  if (!/^---\r?\n/.test(text)) {
    findings.push({
      id: "QG010", severity: "medium",
      title: "Missing frontmatter",
      detail: "Skill files should start with YAML frontmatter (name, description).",
    });
  }
  if (!fm.name) findings.push({ id: "QG011", severity: "low", title: "No `name` in frontmatter", detail: "Hosts rely on `name` to register the skill." });
  if (!fm.description) findings.push({ id: "QG012", severity: "medium", title: "No `description` in frontmatter", detail: "Without a description the agent cannot decide when to load the skill." });
  else if (fm.description.length < 20) {
    findings.push({ id: "QG013", severity: "low", title: "Description too short", detail: "A good description is at least a full sentence explaining when to use the skill." });
  }

  const penalty = findings.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.max(0, 100 - penalty);
  const verdict: SkillReport["verdict"] =
    score < 40 ? "dangerous" : score < 80 ? "risky" : "safe";

  return {
    name: (fm.name as string) || basename(filePath).replace(/\.md$/i, ""),
    path: filePath,
    score,
    verdict,
    findings,
    stats: {
      lines: text.split(/\r?\n/).length,
      hasFrontmatter: /^---\r?\n/.test(text),
      hasDescription: Boolean(fm.description),
    },
  };
}

/** Audit every skill under a directory. */
export function auditDirectory(dir: string): SkillReport[] {
  return findSkillFiles(dir).map(auditSkillFile);
}
