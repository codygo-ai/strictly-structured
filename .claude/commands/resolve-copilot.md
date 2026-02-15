# Address Copilot PR Review

Fetch and triage all GitHub Copilot review comments on a PR. For each comment, either fix the code or reject with justification, then resolve the thread.

## Input

- **PR number** (optional): Pass as `$ARGUMENTS`. If omitted, detect from the current branch:
  ```
  gh pr list --head $(git branch --show-current) --state all --json number --jq '.[0].number'
  ```

## Step 1 — Fetch review comments

```
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --jq '.[] | select(.user.login | test("copilot|bot")) | {id, path, line, body, in_reply_to_id}'
```

Filter to top-level comments only (`in_reply_to_id == null`).

## Step 2 — Read affected files

For each unique `path` in the comments, read the current file contents so you can assess the suggestion in context.

## Step 3 — Triage each comment

For every comment, decide one of:

### Accept (fix)
1. The suggestion is correct and improves the code
2. Implement the fix in the codebase
3. Reply on the PR thread acknowledging the fix:
   ```
   gh api repos/{owner}/{repo}/pulls/{number}/comments \
     --method POST \
     -f body="Fixed — <brief description of what changed>." \
     -F in_reply_to=<comment-id>
   ```

### Reject (won't fix)
1. The suggestion is incorrect, unnecessary, or doesn't apply
2. Reply on the PR thread with justification:
   ```
   gh api repos/{owner}/{repo}/pulls/{number}/comments \
     --method POST \
     -f body="Won't fix — <brief justification>." \
     -F in_reply_to=<comment-id>
   ```

## Step 4 — Run checks

After all fixes are applied, run the mandatory checklist (lint, typecheck, tests) per `.cursor/rules/mandatory-checklist.mdc`.

## Step 5 — Commit and resolve

1. Commit all fixes with message format: `fix: address Copilot review — <summary of changes>`
2. Push to the branch
3. Resolve all addressed comment threads if the GitHub API supports it, or note that replies serve as resolution

## Principles

- **Default to accepting** valid suggestions — Copilot catches real issues
- **Reject clearly** when the suggestion is wrong, over-engineered, or doesn't match project conventions
- Do not blindly apply suggested code verbatim — adapt to project style and patterns
- Group related fixes into a single commit
