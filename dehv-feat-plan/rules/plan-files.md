# Plan files

Where plans live, what a plan folder holds, and how statuses are recorded. The clerk and the
workers follow these rules.

## Plans folder and registry

Plans live in one plans folder, chosen the first time the skill runs. The skill remembers
it, and the folder of every plan (the plans registry), in its state folder:

```text
${XDG_STATE_HOME:-~/.local/state}/dehv-feat-plan/
├── config      # plans_dir=<absolute path>: the folder for new plans
└── plans.tsv   # one row per plan: name<TAB>plans_dir<TAB>created<TAB>updated
```

- Paths are absolute, with `~` expanded. `plans.tsv` keeps its header row.
- The plan folder is always `<plans_dir>/<name>/`, using the `plans_dir` from the plan's row.
- The row's `updated` date changes whenever the plan changes.
- A plan whose folder is missing is never recreated in place: the user moves it with `--dir`.

## Plan folder

```text
<plans_dir>/<name>/
├── PLAN.md          # summary, rules, decisions, Mermaid diagram, status table, values, log
├── steps/
│   ├── 01-<slug>.md # one file per step
│   └── 02-<slug>.md
├── history/
│   ├── INDEX.md     # one row per task run
│   └── 0001-<flag>-<slug>.md  # brief, full report, user answers, what was applied
└── images/          # screenshots linked from the step files (only when there are any)
    └── 02-<slug>-after-<view>.png
```

- Templates: `references/plan-template.md` (with the default plan rules),
  `references/step-template.md` and `references/history-template.md`.
- Keep every text short and clear. Use Mermaid diagrams inside the MD files when they help.
  History reports are the exception: they keep every detail.
- `PLAN.md` and the step files are the source of truth for the plan's content; `history/` is
  the record of how it got there (see `rules/history.md`). A new session has no other memory
  of the plan; `plans.tsv` only says where it is.

## Statuses

`NotStarted` · `InProgress` · `InReview` · `Done` · `Blocked` · `Skipped`

- Every status change updates the `PLAN.md` table, the step file's `Status:` line, and both
  logs: `- YYYY-MM-DD: <change> (H<NNNN>)`.
- Statuses change only after the user's confirmation, and only the clerk changes them, with
  one exception: the "work on step" worker sets its own step to `InProgress` as it starts,
  once the user has approved the step.
- Workers propose statuses in their report and handoff.
