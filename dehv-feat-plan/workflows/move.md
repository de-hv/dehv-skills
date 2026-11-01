# Move (`--dir "<path>"`)

Plan bookkeeping, done by the clerk's `move` job, which also writes the entry.

1. **Clerk `move`** (check only). Act on the case it returns:
   - `already moved` → the row is updated; go to the summary.
   - `move <old> → <new>` → continue below.
   - `not found` or `both exist` → stop and show it. Never overwrite.
2. Show old and new paths and ask to move. Ask too whether `<path>` should also become the
   `config` folder for new plans.
3. **Clerk `move`** (approved).
4. Summary.
