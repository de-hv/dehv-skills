# Move (`--dir "<path>"`)

Plan bookkeeping, done by the clerk. It gets a history entry with `Agent: clerk`.

1. **Clerk `move`** (check only): expands the path, finds where the plan is now (its
   `plans.tsv` row, else `<config plans_dir>/<name>/`) and returns the case:
   - Already at `<path>/<name>/` (you moved it by hand) → the clerk only updates the row.
   - At the old place → it returns old and new paths.
   - Neither exists → it returns where it looked; stop.
   - Both exist → stop and ask which one is the plan. Never overwrite.
2. Show old and new paths and ask to move. Ask too whether `<path>` should also become the
   `config` folder for new plans.
3. **Clerk `move`** (approved): moves the folder (with `history/`), updates the row, the path
   in `PLAN.md` `Values` and the `PLAN.md` log, and `config` if you said so.
4. Summary.
