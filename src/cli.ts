#!/usr/bin/env node
import { auditDirectory, auditSkillFile } from "./scanner.js";
import { renderJson, renderTable } from "./report.js";

const USAGE = `
  skillguard — audit Agent Skills before you install them

  Usage:
    skillguard <path>            Audit a skill file or a directory of skills
    skillguard <path> --json     Machine-readable output (CI friendly)
    skillguard --min-score 80    Exit non-zero when any skill scores below N

  Examples:
    skillguard ./my-skill/SKILL.md
    skillguard ~/.claude/skills --min-score 70
    skillguard . --json > report.json
`;

interface Args {
  path?: string;
  json: boolean;
  minScore?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") args.json = true;
    else if (a === "--min-score") args.minScore = Number(argv[++i]);
    else if (a === "-h" || a === "--help") { console.log(USAGE); process.exit(0); }
    else args.path = a;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) { console.error(USAGE); process.exit(2); }

  let reports;
  try {
    if (args.path.endsWith(".md")) reports = [auditSkillFile(args.path)];
    else reports = auditDirectory(args.path);
  } catch (e) {
    console.error(`skillguard: ${(e as Error).message}`);
    process.exit(2);
  }

  console.log(args.json ? renderJson(reports) : renderTable(reports));

  let failed = false;
  if (args.minScore !== undefined && reports.some((r) => r.score < args.minScore!)) failed = true;
  if (reports.some((r) => r.verdict === "dangerous")) failed = true;
  if (failed) process.exit(1);
}

main();
