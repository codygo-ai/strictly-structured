# Plan Kickoff

Create a GitHub issue from the approved plan, optionally create a linked branch and worktree.

## Step 1 — Read the plan

Find the plan file from the conversation context. If unclear, check the most recent file in `.claude/plans/`. Extract the title (first `#` heading) and the full markdown body.

## Step 2 — Create GitHub issue

Run:

```
gh issue create --title "<plan title>" --body "<full plan markdown>" --label "plan"
```

If the `plan` label doesn't exist yet, create it first:

```
gh label create plan --description "Implementation plan" --color 0E8A16
```

Parse the issue number from the output. Show the issue URL to the user.

## Step 3 — Offer branch + worktree

Ask the user (using AskUserQuestion) what to set up:

1. **Branch + worktree** — linked branch and a worktree to work in
2. **Branch only** — linked branch, no worktree
3. **Skip** — just the issue

If the user wants a branch:

1. Derive a kebab-case slug from the plan title (max ~40 chars, no special characters)
2. Create a linked branch using `gh issue develop`:
   ```
   gh issue develop <number> --name feat/<number>-<slug> --base main
   ```
3. Fetch it locally:
   ```
   git fetch origin
   ```

If the user also wants a worktree:

1. Determine the repo directory name from the current working directory
2. Create the worktree:
   ```
   git worktree add ../<repo-dirname>-<slug> feat/<number>-<slug>
   ```
3. Report the worktree path to the user

## Step 4 — Summary

Print a summary with:
- Issue URL
- Branch name (if created)
- Worktree path (if created)

The branch is auto-linked to the issue via `gh issue develop`, so any PR from it will automatically close the issue.
