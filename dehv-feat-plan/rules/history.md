# History

Every task is saved in the plan's `history/`, so any part of the progress can be checked
later, from any session. The orchestrator, the clerk and the workers follow these rules.

- **One entry per task run**, numbered in order (`H0001`, `H0002`, …), file
  `history/NNNN-<flag>-<slug>.md`, from `references/history-template.md`.
- **Numbers:** the orchestrator takes the first one from the snapshot's `Next entry` and
  counts up itself for every task it dispatches in the run, the clerk's own entries
  included. Parallel tasks get consecutive numbers.
- **The worker writes its entry:** first the header with `Result: Running` and its brief
  exactly as received, then, when done, its full report and the final `Result`. A continued
  sub-agent appends each new message and report, with the time.
- **The clerk keeps `INDEX.md`:** workers never touch it, so parallel tasks don't clash. On
  `open` and `apply` the clerk adds or updates the row of every entry, writes the user's
  questions and answers word for word under `User`, and what was applied under `Applied`.
- **Closed entries are never edited.** An entry closes when the clerk writes the time in its
  `Closed` line, with `apply` at the end of its run. Until then it says `Closed: open`, so an
  interrupted run stays visible. Entries with no `Closed` line, from older plans, count as
  closed unless they're `Running` or `Blocked`. Corrections go in a new entry that names the old
  one (`Continues: H0007`).
- **Bookkeeping without a worker** (an empty plan, a move, status shortcuts) gets its own
  entry from the clerk, with `Agent: clerk` and no report, closed as soon as it's written.
- Clerk snapshots and views and the summary don't get entries.
- **Cite entries** in the logs: `- 2026-10-26: step 02 → InReview (H0007)`.
- **No secrets.** Briefs and reports leave out tokens, passwords, cookies and personal data.
- Plans made before the history existed get `history/INDEX.md` on their next `open`.
