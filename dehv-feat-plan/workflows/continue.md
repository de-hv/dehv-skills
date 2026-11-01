# Continue (`--continue`, or `--step <n> "<details>"`)

With `--step <n>`, the same workflow runs for step `n` instead of the next step.

If the snapshot's `Open` line lists entries, first resolve them (see
[Interrupted runs](#interrupted-runs)).

1. **Worker "check"** (read-only, one per repo in parallel): compares reality with the plan:
   `git log`, branches and diffs, uncommitted changes and the current branch, the current code
   against what each step says, PR state if known, and your details. Its handoff lists the
   drift ("step 2 says X, the code has Y"), suggested statuses with a reason ("branch merged →
   `Done`") and proposed plan updates.
2. Show the drift and suggestions. Plan updates you accept go to an Update worker. If a repo
   has uncommitted changes, ask whether to wait for your commit or go on with them; only going
   on is quoted as an approval in the step's brief.
3. **Clerk `apply` + `propose`**: applies the statuses you confirmed and any status shortcuts
   you gave, and returns the step's proposal: goal, files, tests, branch name and, for UI
   steps, the screenshots to take (see [Screenshots](#screenshots)). Show it and **wait for
   your OK.**
4. If you approved screenshots, run the "before" ones first.
5. **Worker "work on step NN"**: checks the repos are ready (see `references/worker.md`), sets
   the step to `InProgress`, follows the step file and the plan rules, keeps the step's
   checklist, `Deviations` and log updated, runs tests, lint and build, and proposes a commit
   message with `dehv-commit`. It lists any later steps a deviation affects. Large steps may be
   split into several runs, each with its own entry. List the skills it needs under `Follow`.
6. Take the "after" screenshots if approved. Later steps affected by a deviation go to an
   Update worker (see `update.md`).
7. Summary: results of tests, lint and build, deviations, the commit proposal and what's
   needed from you. Then ask for the new status and the rest of `Needs from user`.
8. Clerk `apply`, then offer the next step (see "Long runs" in `SKILL.md`).

## Interrupted runs

Sub-agents from an earlier session can't be continued, and a `Running` entry may belong to
another session that's still working. Show each open entry and ask what to do, then act:

- **`Running`:** if you say it's dead, clerk `apply` closes it (`Failed` when it has no report).
  Redo the work with a new worker whose entry has `Continues: H<NNNN>`; it starts by checking
  what the old one left in the repos.
- **`Blocked`:** show its `Needs from user`. Your answer goes in the brief of a new worker
  with `Continues: H<NNNN>`, and clerk `apply` closes the old entry.
- **`Done` or `Partial`, not closed:** the run ended before its closing questions. Show the
  report's proposed statuses and updates, ask, then clerk `apply` applies your answer and
  closes it.

## Screenshots

Add real screenshots when they make a UI change easier to understand: a new or changed
screen, layout, component or state. Skip them for steps that don't change the UI.

1. **Propose** them with the step (which views and states) and wait for your OK. The app URL
   comes from the snapshot; if it's missing, ask, and the clerk saves it in `Values`.
2. **Worker "screenshots before" / "screenshots after"**: follows
   `references/screenshots.md` (pass its absolute path), with the plan folder, the step file,
   the app URL, the views and states, and whether `@playwright/cli` may be installed.
3. **Sign-in or install needed:** the worker stops with the browser still open and asks
   under `Needs from user`. Ask you, wait for your OK, then continue the same sub-agent.
4. Its report lists the files saved in `images/` and the rows added to the step file's
   `Screenshots` section.
