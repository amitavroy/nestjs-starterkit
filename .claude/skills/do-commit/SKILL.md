---
name: do-commit
description: Commit staged/unstaged changes with an auto-generated message and optional ticket reference
disable-model-invocation: false
---

Commit the current working tree changes. Follow these steps exactly:

## Step 1 — Determine the ticket ID

First check whether the change being worked on already carries a ticket ID: look for an active OpenSpec change folder under `openspec/changes/` whose name embeds a ticket reference (e.g. `gh17-fetch-text-markdown` → `GH-17`, matching a pattern like `gh-?(\d+)` at the start of the folder name). Identify the relevant folder from context (the change currently being implemented, or inferred from files touched in the diff) rather than guessing among unrelated changes.

- If exactly one relevant change folder is found and its name encodes a ticket ID, use that ticket ID directly (normalize to the `GH-42` style) and skip asking the user.
- If no ticket ID can be confidently derived this way, fall back to asking the user with AskUserQuestion:

> "Do you have a git ticket ID to include in this commit?"

Options:
- "Yes, I have a ticket ID"
- "No ticket"

If the user selects "Yes", ask a second AskUserQuestion:

> "Enter your ticket ID (e.g. GH-42, PROJ-123):"

Provide an "Other" option so the user can type the value freely.

## Step 2 — Inspect the working tree

Run these in parallel:
- `git status` — identify changed, staged, and untracked files
- `git diff HEAD` — see all unstaged and staged changes

Do NOT include files that look like secrets (.env, credentials, private keys).

## Step 3 — Draft the commit message

Analyse the diff and write a commit message with a subject and a body:
- Subject line: imperative mood, ≤72 chars, no trailing period
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- If a ticket ID was provided, append it at the end of the subject line in parentheses, e.g. `feat: add content crawl endpoint (GH-42)`
- Body: one blank line after the subject, then a few sentences or short bullet points describing what changed and why, based on the diff. Focus on the "why" over the "what" where possible.
- **Archive commits close the ticket:** if the diff moves a change folder into `openspec/changes/archive/` (i.e. this commit archives a completed OpenSpec change), the underlying ticket is done — add a closing line at the end of the body so GitHub auto-closes the issue on merge: `Closes #<number>`, using the numeric part of the ticket ID (e.g. ticket `GH-24` → `Closes #24`). Only add this when a ticket ID is present and the commit is an archive commit; skip it for regular implementation commits on the same ticket.
- Also, the commit messages should be concise. Make it caveman style and not very verbose.

## Step 4 — Ask for confirmation

Show the drafted commit message (subject and body) to the user, then use AskUserQuestion to ask:

> "Does this commit message look good?"

Options:
- "Looks good, commit it"
- "I want to change the message"

If the user selects "I want to change the message", ask a follow-up AskUserQuestion:

> "Enter your preferred commit message:"

Provide an "Other" option so the user can type freely. Use their message as the subject line (still append the ticket ID if one was provided and it is not already present). Keep the drafted body unless the user's replacement text also includes a body.

## Step 5 — Stage and commit

Stage relevant files by name (avoid `git add -A` to prevent accidentally including sensitive files).

Create the commit using a HEREDOC:

```
git commit -m "$(cat <<'EOF'
<subject line>

<body>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

## Step 6 — Confirm

Run `git log --oneline -1` and report the final commit hash and message to the user.
