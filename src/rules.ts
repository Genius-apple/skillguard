import type { Finding } from "./types.js";

interface Rule {
  id: string;
  severity: Finding["severity"];
  title: string;
  pattern: RegExp;
  detail: string;
}

/** Security rules: patterns that indicate destructive or exfiltrating behavior. */
export const SECURITY_RULES: Rule[] = [
  {
    id: "SG001",
    severity: "critical",
    title: "Recursive filesystem deletion",
    pattern: /\brm\s+-rf\s+(\/|~|\$HOME|\.\.)/,
    detail: "Deletes root, home, or parent directories — classic destructive payload.",
  },
  {
    id: "SG002",
    severity: "critical",
    title: "Possible credential exfiltration",
    pattern: /\.(ssh|aws|netrc|npmrc|env)\b[^]*?(curl|wget|fetch|http\.post|requests\.post)/i,
    detail: "References to credential stores combined with outbound network calls.",
  },
  {
    id: "SG003",
    severity: "high",
    title: "Piped download-and-execute",
    pattern: /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b/,
    detail: "Downloads a script from the network and pipes it straight into a shell.",
  },
  {
    id: "SG004",
    severity: "high",
    title: "Hardcoded secret",
    pattern: /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})\b/,
    detail: "Looks like a hardcoded API key (OpenAI / GitHub / AWS / Slack).",
  },
  {
    id: "SG005",
    severity: "medium",
    title: "Env file exposure",
    pattern: /\b(cat|type|Get-Content)\s+.*\.env\b/,
    detail: "Reads .env files which commonly contain secrets.",
  },
  {
    id: "SG006",
    severity: "medium",
    title: "Reverse shell / listener",
    pattern: /\b(nc|ncat|netcat)\s+-[le]\b|\/dev\/tcp/,
    detail: "Network listener or raw TCP redirection, common in reverse shells.",
  },
  {
    id: "SG007",
    severity: "high",
    title: "Obfuscated execution",
    pattern: /\b(echo|printf)\s+.*\|\s*(ba)?sh\b|eval\s*\(\s*atob\s*\(|base64\s+-d\b/,
    detail: "Decodes or pipes encoded content into a shell — hides real intent.",
  },
  {
    id: "SG008",
    severity: "medium",
    title: "Cron / persistence hook",
    pattern: /\b(crontab|launchctl|schtasks\s+\/create|reg\s+add\s+.*Run)\b/,
    detail: "Installs persistence so the skill runs beyond a single session.",
  },
  {
    id: "SG009",
    severity: "medium",
    title: "Remote code fetch at runtime",
    pattern: /\b(npx|pip\s+install|npm\s+i?nstall)\s+\S+@?(https?:)?\/\/|iex\s*\(\s*Invoke-WebRequest/i,
    detail: "Installs or executes packages from raw URLs at runtime.",
  },
  {
    id: "SG010",
    severity: "low",
    title: "Prompt-injection phrasing",
    pattern: /\b(ignore (all )?(previous|prior) instructions|disregard your (system )?prompt|you are now)\b/i,
    detail: "Phrasing typically used to jailbreak the host agent.",
  },
];

/** Quality rules: style and structure issues (non-security). */
export const QUALITY_RULES: Rule[] = [
  {
    id: "QG001",
    severity: "low",
    title: "Prompt-injection in instructions",
    pattern: /\b(ignore (all )?(previous|prior) instructions|disregard your (system )?prompt)\b/i,
    detail: "Skill instructions try to override the host agent.",
  },
  {
    id: "QG002",
    severity: "info",
    title: "Very long single-line",
    pattern: /^.{2000,}$/m,
    detail: "Lines over 2000 chars hurt readability and diffing.",
  },
];
