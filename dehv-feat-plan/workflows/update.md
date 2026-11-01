# Update (`--update`)

1. **Worker "update plan"**: applies the change to `PLAN.md` and the step files, following
   "Step numbers" in `rules/plan-files.md`: steps keep their number and slug, even when the
   order changes. It keeps the table, links and dependencies consistent and every status as it
   is. Its report lists every file changed and any step it proposes as `Skipped`.
2. Summary, then clerk `apply` to log the change in `PLAN.md`, citing the entry.
