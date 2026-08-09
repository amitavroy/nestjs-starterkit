---
name: do-work
description: Work on the next section of the task
disable-model-invocation: true
---

You need to use the opsx:apply skill available from openspec to work on a task mentioned in tasks.md

You should work only on one section from the tasks.md and not the entire tasks.md list.

After one section is done, mark the tasks in that section as done and your work is done. The operator will invoke you again to continue work.

On completion of the tasks of a section, run formatting for only the files that were changed. And after the formatting, ask user if he wants to use the do-commit skill to commit changes.
