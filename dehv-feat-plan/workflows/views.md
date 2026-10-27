# Views (`--status`, `--step <n>`, `--history`)

Read-only: no workers, no history entry, no summary. Clerk `open` with a `view` returns it
ready to show; show it exactly as returned.

- `--status` → `view: status`: the steps table, any `Blocked` items, the next step and the
  last history entry.
- `--step <n>` → `view: step <n>`: the step and its history entries. With details, run
  `continue.md` for this step instead.
- `--history` → `view: history` and the argument:
  - No argument: `INDEX.md`.
  - `<entry>`: a digest of the entry (header, result, summary, files changed, your answers,
    what was applied) and its path. The full entry only if you ask for it.
  - `<n>` (a step): its entries in order, one line each on what it did.
  - `"<question>"`: the answer from the entries, citing every entry it uses (`H0007`).
