# Continue (`--continue`, or `--step <n> "<details>"`)

With `--step <n>`, the same workflow runs for step `n` instead of the next step.

1. **Worker "check"** (read-only, one per repo in parallel): compares reality with the plan:
   `git log`, branches and diffs, the current code against what each step says, PR state if
   known, and your details. Its handoff lists the drift ("step 2 says X, the code has Y"),
   suggested statuses with a reason ("branch merged → `Done`") and proposed plan updates.
2. Show the drift and suggestions. Plan updates you accept go to an Update worker.
3. **Clerk `apply` + `propose`**: applies the statuses you confirmed and any status shortcuts
   you gave, and returns the step's proposal: goal, files, tests, branch name and, for UI
   steps, the screenshots to take (see [Screenshots](#screenshots)). Show it and **wait for
   your OK.**
4. If you approved screenshots, run the "before" ones first.
5. **Worker "work on step NN"**: sets the step to `InProgress`, follows the step file and the
   plan rules, keeps the step's checklist, `Deviations` and log updated, runs tests, lint and
   build, and proposes a commit message with `dehv-commit`. It lists any later steps a
   deviation affects. Large steps may be split into several runs, each with its own entry.
6. Take the "after" screenshots if approved. Later steps affected by a deviation go to an
   Update worker (see `update.md`).
7. Summary: results of tests, lint and build, deviations, the commit proposal and what's
   needed from you. Then ask for the new status and the rest of `Needs from user`.
8. Clerk `apply`, then offer the next step (see "Long runs" in `SKILL.md`).

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
