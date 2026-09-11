import type { SkillReport } from "./types.js";

const ICON: Record<string, string> = {
  critical: "🚨",
  high: "🔴",
  medium: "🟠",
  low: "🟡",
  info: "ℹ️",
};

export function renderTable(reports: SkillReport[]): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("  🛡️  SkillGuard — Agent Skill Security & Quality Audit");
  lines.push("  " + "─".repeat(60));
  for (const r of reports) {
    const badge = r.verdict === "safe" ? "✅ SAFE" : r.verdict === "risky" ? "⚠️  RISKY" : "☠️  DANGEROUS";
    lines.push(`  ${r.name}  [${badge}]  score ${r.score}/100  (${r.path})`);
    for (const f of r.findings) {
      lines.push(`    ${ICON[f.severity]} ${f.id} ${f.severity.toUpperCase().padEnd(8)} ${f.title}${f.line ? ` (line ${f.line})` : ""}`);
      lines.push(`       ${f.detail}`);
      if (f.snippet) lines.push(`       > ${f.snippet}`);
    }
    if (r.findings.length === 0) lines.push("    No issues found.");
    lines.push("");
  }
  const worst = reports.reduce((m, r) => (r.score < m ? r.score : m), 100);
  const dangerous = reports.filter((r) => r.verdict === "dangerous").length;
  lines.push(`  ${reports.length} skill(s) audited. Lowest score: ${worst}/100${dangerous ? `, ${dangerous} dangerous.` : "."}`);
  return lines.join("\n");
}

export function renderJson(reports: SkillReport[]): string {
  return JSON.stringify({ tool: "skillguard", version: "0.1.0", reports }, null, 2);
}
