export interface Finding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  line?: number;
  snippet?: string;
}

export interface SkillReport {
  name: string;
  path: string;
  score: number; // 0-100
  verdict: "safe" | "risky" | "dangerous";
  findings: Finding[];
  stats: { lines: number; hasFrontmatter: boolean; hasDescription: boolean };
}

export const SEVERITY_WEIGHT: Record<Finding["severity"], number> = {
  critical: 45,
  high: 20,
  medium: 8,
  low: 3,
  info: 0,
};
