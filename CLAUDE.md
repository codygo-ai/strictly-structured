# Claude Code Project Instructions

## Plan Mode

For non-trivial tasks, offer to switch to plan mode so the approach can be reviewed and approved before implementation begins. Simple, straightforward changes can proceed directly.

## Cursor Rules

All project rules are defined in `.cursor/rules/`. Read and follow every rule file before planning or making any changes:

- `.cursor/rules/code-quality.mdc` — Core principles, code style, error handling
- `.cursor/rules/typescript-rules.mdc` — TypeScript type safety rules
- `.cursor/rules/project-structure.mdc` — Monorepo structure, pnpm, package imports
- `.cursor/rules/mandatory-checklist.mdc` — Lint, typecheck, test after every change
- `.cursor/rules/commit-messages.mdc` — Conventional Commits format

These are the single source of truth. Do not duplicate their content here.

## Post-Implementation Review (Mandatory)

After completing all implementation steps and passing lint/typecheck/tests, invoke the `/project:review` skill. This skill reviews the implementation against the original requirements and project quality rules.

- If the review returns **CHANGES_NEEDED**: fix all listed issues, re-run lint/typecheck/tests, then invoke `/project:review` again.
- Repeat until the review returns **APPROVED**.
- Do not mark the task as complete until the review is approved.

## Self-Improvement Protocol

At the end of each completed task (not every turn), if any of these occurred:
- User had to correct you or expressed frustration
- You made a wrong approach, hallucinated, or violated project rules
- Tests/lint/typecheck failed due to your code

Then propose a specific, minimal rule to add to `.cursor/rules/` or `CLAUDE.md` that would prevent this class of mistake. Ask before applying.
