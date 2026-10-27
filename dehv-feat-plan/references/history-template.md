# History templates

The worker writes its own entry. The clerk keeps `INDEX.md` and the `User` and `Applied`
sections, and writes the entries for bookkeeping it does on its own.

## `history/INDEX.md`

```markdown
# History · <name>

| # | Date | Flag | Step | Task | Result | Entry |
| --- | --- | --- | --- | --- | --- | --- |
| H0001 | YYYY-MM-DD | create | plan | Create plan folder | Done | [H0001](0001-create-plan.md) |
```

## `history/NNNN-<flag>-<slug>.md`

The brief and the report go inside four-backtick fences, so their own headings and code
blocks stay intact.

`````markdown
# H<NNNN> · <flag> · <task title>

- **Date:** YYYY-MM-DD HH:MM
- **Flag:** <--continue, --update, …>
- **Step:** <NN-slug, or plan>
- **Agent:** <worker · agent type | clerk | none: orchestrator>
- **Result:** <Running | Done | Partial | Blocked | Failed>
- **Continues:** <H<NNNN>, or none>

## Brief

````markdown
<the brief exactly as received; for follow-ups sent to the same sub-agent, add each message
below with its time>
````

## Report

````markdown
<the full report; for a continued sub-agent, add each new report below with its time>
````

## User

- Q: <question asked> → A: <answer, word for word>

## Applied

- <what the clerk changed afterwards: statuses, files, rows, with paths>
`````
