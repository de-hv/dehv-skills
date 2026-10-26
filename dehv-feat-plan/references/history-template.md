# History templates

## `history/INDEX.md`

```markdown
# History · <name>

| # | Date | Flag | Step | Task | Result | Entry |
| --- | --- | --- | --- | --- | --- | --- |
| H0001 | YYYY-MM-DD | create | plan | Research repos | Done | [H0001](0001-create-research.md) |
```

## `history/NNNN-<flag>-<slug>.md`

The brief and the report go inside four-backtick fences, so their own headings and code
blocks stay intact.

`````markdown
# H<NNNN> · <flag> · <task title>

- **Date:** YYYY-MM-DD HH:MM
- **Flag:** <--continue, --update, …>
- **Step:** <NN-slug, or plan>
- **Agent:** <type> · id <agent id> (or "none: orchestrator")
- **Result:** <Running | Done | Partial | Blocked | Failed>
- **Continues:** <H<NNNN>, or none>

## Brief

````markdown
<the brief exactly as sent; for follow-ups sent to the same sub-agent, add each message below
with its time>
````

## Report

````markdown
<the report exactly as returned; for a continued sub-agent, add each new report below with its
time>
````

## User

- Q: <question asked> → A: <answer, word for word>

## Applied

- <what the orchestrator changed afterwards: statuses, files, rows, with paths>
`````
