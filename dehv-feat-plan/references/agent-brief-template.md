# Brief: <task title>

You are a worker sub-agent of the `dehv-feat-plan` skill. Read
`<absolute path of references/worker.md>` first and follow it: it says how to save your work
and what to return.

## Plan

- **Plan:** <name> — `<absolute plan folder>`
- **History entry:** H<NNNN> → `<plan folder>/history/NNNN-<flag>-<slug>.md` (cite it in any
  log line you write)
- **Agent:** worker · <agent type>
- **Read first:** `<plan folder>/PLAN.md` (including its `Rules`), `<step file paths>`
- **Repos:** <repo → absolute path>

## Task

<What to do, in a few lines. Flag and step.>

## Context from the orchestrator

<Your details and answers, word for word. Session context the sub-agent can't see. Earlier
history entries that matter, by path.>

## You may

- **Read:** <scope>
- **Change:** <exact files or folders, or "nothing: read-only">, plus your own history entry
- **Follow:** `<skill folder>/rules/history.md`, `<skill folder>/rules/plan-files.md`, plus
  <absolute paths of other reference files and skills, or "nothing else">
- **Approved by the user:** <the approval quoted word for word, or "nothing">
