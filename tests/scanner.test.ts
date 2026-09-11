import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { auditSkillFile, findSkillFiles } from "../src/scanner.js";

const fixture = (name: string) => join(__dirname, "fixtures", name);

describe("auditSkillFile", () => {
  it("flags rm -rf as critical/dangerous", () => {
    const r = auditSkillFile(fixture("malicious-skill.md"));
    expect(r.verdict).toBe("dangerous");
    expect(r.findings.some((f) => f.id === "SG001" && f.severity === "critical")).toBe(true);
    expect(r.score).toBeLessThan(40);
  });

  it("detects hardcoded API keys", () => {
    const r = auditSkillFile(fixture("leaky-skill.md"));
    expect(r.findings.some((f) => f.id === "SG004")).toBe(true);
  });

  it("clean skill passes", () => {
    const r = auditSkillFile(fixture("clean-skill.md"));
    expect(r.verdict).toBe("safe");
    expect(r.score).toBe(100);
  });

  it("flags missing frontmatter/description", () => {
    const r = auditSkillFile(fixture("no-frontmatter.md"));
    expect(r.findings.some((f) => f.id === "QG010")).toBe(true);
    expect(r.findings.some((f) => f.id === "QG012")).toBe(true);
  });

  it("extracts name from frontmatter", () => {
    const r = auditSkillFile(fixture("clean-skill.md"));
    expect(r.name).toBe("demo-clean");
  });
});

describe("findSkillFiles", () => {
  it("discovers all fixtures recursively", () => {
    const files = findSkillFiles(join(__dirname, "fixtures"));
    expect(files.length).toBe(3);
  });
});
