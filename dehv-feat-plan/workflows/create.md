# Create (`<name>` or `<name> "<details>"`)

1. If the plan exists, the `open` call returns the status view (`view: status`): show it
   instead. Never overwrite.
2. **Clerk `create`**: the plan folder, `history/INDEX.md`, `PLAN.md` from the template with
   empty sections, the plan's row in `plans.tsv`, and entry `H0001`. Without details, the
   summary follows and the run ends.
3. With details:
   - **Worker "research"** (read-only): reads the involved repos (structure, the files the
     change touches, conventions, recent history) and returns a step breakdown with real file
     paths, file estimates and open questions (for example, whether one step = one PR).
   - Ask the open questions.
   - **Worker "write plan"**: writes `PLAN.md` (summary, rules — the template's defaults,
     changed by your details, for example a different file limit —, decisions, a Mermaid
     diagram if useful, the status table, all `NotStarted`) and one `steps/NN-<slug>.md` per step,
     from the research report (by its entry path) and your answers. It may be the research
     sub-agent, continued.
4. Summary, then clerk `apply` to log the creation, citing the entries.
