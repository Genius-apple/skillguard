# Contributing to SkillGuard

Thanks for your interest! The highest-value contributions are **new detection rules**.

## Adding a rule

1. Open `src/rules.ts` and add to `SECURITY_RULES` (id `SG0xx`) or `QUALITY_RULES` (id `QG0xx`).
2. Keep regexes tight — false positives are worse than missing a rule.
3. Add a minimal fixture in `tests/fixtures/` reproducing the pattern.
4. Add a test in `tests/scanner.test.ts` asserting the finding id.
5. Run `npm test`.

## Local development

```bash
npm install
npm run build
node dist/cli.js tests/fixtures/malicious-skill.md
```

## PR guidelines

- One rule/feature per PR.
- Update README's feature list if user-visible.
- CI must be green.

## Reporting vulnerabilities

Do NOT open a public issue for security problems in SkillGuard itself. Use GitHub's private security advisory feature.
