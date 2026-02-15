# Claude Code Project Instructions

## Plan Mode

For non-trivial tasks, offer to switch to plan mode so the approach can be reviewed and approved before implementation begins. Simple, straightforward changes can proceed directly.

## Plan Kickoff

After a plan is approved and before implementation begins, offer to run `/project:kickoff` to create a GitHub issue, branch, and worktree from the plan. The user can skip if they prefer to manage this manually.

The kickoff command will create infrastructure AND begin implementation automatically. Do not wait between kickoff and implementation — they are one continuous flow.

## Cursor Rules

All project rules are defined in `.cursor/rules/`. Read and follow every rule file before planning or making any changes:

- `.cursor/rules/code-quality.mdc` — Core principles, code style, error handling
- `.cursor/rules/typescript-rules.mdc` — TypeScript type safety rules
- `.cursor/rules/project-structure.mdc` — Monorepo structure, pnpm, package imports
- `.cursor/rules/mandatory-checklist.mdc` — Lint, typecheck, test after every change
- `.cursor/rules/commit-messages.mdc` — Conventional Commits format

These are the single source of truth. Do not duplicate their content here.

## Post-Implementation Review (MANDATORY — Non-Negotiable)

When all implementation steps are complete and lint/typecheck/tests pass:

1. **Immediately** invoke `/project:review`. Do not ask the user. Do not skip. This is not optional.
2. If the review returns **CHANGES_NEEDED**: fix all listed issues, re-run lint/typecheck/tests, then invoke `/project:review` again.
3. Repeat until the review returns **APPROVED**.
4. After **APPROVED**: the review command will offer to create a PR. Follow its instructions.
5. Do not mark the task as complete until the review is approved and the user has responded to the PR offer.

## Complete Workflow

For reference, the full lifecycle of a non-trivial task:

1. **Plan** — Switch to plan mode, design the approach
2. **Kickoff** (`/project:kickoff`) — Create issue, branch, worktree → immediately begin implementation
3. **Implement** — Write code, run lint/typecheck/tests after each change
4. **Review** (`/project:review`) — Mandatory review against requirements and quality rules
5. **PR** — After APPROVED review, create a draft PR that closes the issue
6. **Self-Improvement** — Reflect on mistakes and propose rule improvements

Steps 2–5 flow automatically. The only user interaction points are: approving the plan (step 1), choosing branch/worktree options (step 2), and confirming PR creation (step 5).

## Dev Tips

- **Reset onboarding hint:** The first-visit banner is dismissed via `localStorage`. To see it again during development, run `localStorage.removeItem("ssv-onboarding-dismissed")` in the browser console and refresh.

## Self-Improvement Protocol

At the end of each completed task (not every turn), if any of these occurred:
- User had to correct you or expressed frustration
- You made a wrong approach, hallucinated, or violated project rules
- Tests/lint/typecheck failed due to your code

Then propose a specific, minimal rule to add to `.cursor/rules/` or `CLAUDE.md` that would prevent this class of mistake. Ask before applying.
