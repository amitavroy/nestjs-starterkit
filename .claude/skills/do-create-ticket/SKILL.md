---
name: do-create-ticket
description: Create a GitHub issue from the current explore session context, then launch the propose flow. Use between /opsx:explore and /opsx:propose.
license: MIT
compatibility: Requires openspec CLI and gh CLI authenticated.
metadata:
  author: project
  version: "1.0"
---

Create a GitHub issue from the current explore conversation, then kick off the propose flow.

This skill bridges explore → propose by:
1. Synthesizing the explored feature into a GitHub issue
2. Creating the issue to get a ticket ID
3. Launching `/opsx:propose` with the ticket ID in context

---

**Steps**

1. **Synthesize the issue from conversation context**

   Review the current conversation (the explore session) and extract:
   - A concise issue **title** (imperative, under 72 chars — e.g. "Add GitHub ticket creation stage to OpenSpec workflow")
   - A **description** covering:
     - What the feature/fix is
     - Why it's needed (motivation from the explore discussion)
     - Any key decisions or constraints surfaced during exploration

   Present your draft to the user:
   ```
   Here's what I'll create as the GitHub issue:

   **Title**: <title>

   **Description**:
   <description>
   ```

   Use the **AskUserQuestion tool** to ask:
   > "Does this look right, or would you like to adjust the title or description?"

   Options: "Looks good — create it", "Adjust title", "Adjust description", "Adjust both"

   If they want adjustments, ask for the corrected text and update your draft before proceeding.

2. **Create the GitHub issue**

   ```bash
   gh issue create --title "<title>" --body "<description>"
   ```

   Parse the output to extract the issue URL and number. GitHub CLI outputs the URL on success, e.g.:
   ```
   https://github.com/owner/repo/issues/42
   ```

   Extract the number from the URL (last path segment).

   Show the user:
   ```
   Created GitHub issue #<number>: <url>
   ```

3. **Derive the change name**

   From the issue title, derive a kebab-case slug:
   - Lowercase
   - Replace spaces and punctuation with hyphens
   - Remove stop words if the result is too long (aim for 3-5 words)
   - Example: "Add GitHub ticket creation stage" → `github-ticket-creation-stage`

   Prefix with the ticket number: `<number>-<slug>`
   Example: `42-github-ticket-creation-stage`

4. **Hand off to propose**

   Tell the user:
   ```
   Kicking off the proposal for #<number>-<slug>...
   ```

   Then invoke the **openspec-propose** skill with the derived change name `<number>-<slug>` as the input — do NOT ask what they want to build (the explore session already answered that). Pass the context forward: use the explored feature description to inform all artifacts.

---

**Guardrails**

- Always confirm the issue draft with the user before creating it — never create silently.
- If `gh` is not authenticated or the repo has no remote, surface a clear error and stop.
- The change name prefix must be the numeric ticket ID only (e.g. `42-`, not `#42-`).
- Do not re-ask what the user wants to build in the propose step — you already know from context.
- If the explore session had no clear conclusion, ask the user to summarize what they want to build before drafting the issue.
