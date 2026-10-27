# Import (`--import`)

1. Ask before reading Jira. Then **clerk `create`** (the import entries need the plan
   folder) and **workers "import"** (read-only, in parallel, one per kind of source): Jira
   issues, branches and commits, PRs. Session context exists only in this conversation, so
   the orchestrator writes what matters from it into the briefs.
2. **Worker "write plan"**: writes the plan as in `create.md`, with statuses already filled
   in from the import entries.
3. Summary, including what was inferred, then ask for corrections.
4. Corrections go to an Update worker (see `update.md`); then clerk `apply`.
