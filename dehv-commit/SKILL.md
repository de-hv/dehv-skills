---
name: dehv-commit
description: Suggests a commit message (a short title plus a detailed body) from the current changes, without committing. The user reviews the message and commits by hand. Use when the user asks for a commit message, a suggested commit, or wants to describe staged or unstaged changes before committing. Not for actually making the commit. Accepts optional hints such as a title, ticket, type, focus or language.
argument-hint: "[title hint] [ticket=ABC-123] [type=feat|fix|refactor|test|docs|chore] [focus=...] [lang=...]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git branch --show-current), Read, Grep, Glob
---

# Suggest a commit message

Write a clear, short, detailed commit message for the current changes. **Never commit.** The user will commit by hand, possibly using this suggestion.

## Rules
- Read-only. Don't run `git commit`, `git add`, `git reset`, `git stash`, `git push`, or anything else that changes the repo or the index.
- Describe only what is in the diff. Don't invent motivation, tickets or test results you can't see.
- No attribution or co-author lines unless the user asks for them.

## 1. Gather context
1. `git status --short` and `git branch --show-current`.
2. Pick the scope:
   - If there are no changes at all, say so and stop.
   - If anything is staged, describe only the staged changes: `git diff --cached -M --stat`, then `git diff --cached -M`. If there are also unstaged or untracked changes, say in the output that the message leaves them out.
   - If nothing is staged, describe the working-tree changes (`git diff -M --stat`, `git diff -M`) and note that the message assumes everything will be staged. `git diff` doesn't show untracked files, so read the ones from `git status` that look like part of the change: they can be the main part of it.
3. For large diffs, start from the `--stat` output and read only the files needed to understand intent: renames, new modules, tests, config.
4. Match the repo's style: look at `git log --no-merges --oneline -15` for tense, prefixes (`feat:`, ticket ids) and title length.
5. Look for a ticket id in the branch name (for example `feat/ABC-123/...` gives `ABC-123`), unless an argument overrides it.

## 2. Apply the arguments (all optional, any order)
- **Free text:** treat it as the title, or a hint for it. Keep the user's wording and only tighten it to fit the rules.
- **`ticket=<id>`:** use this ticket instead of the one from the branch. `ticket=none` drops it.
- **`type=<kind>`:** use a conventional-commit prefix (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). Without it, follow the repo's usual style.
- **`focus=<text>`:** put this aspect first in the body (for example "tests" or "structure").
- **`lang=<code>`:** write the message in that language. The default is English.

## 3. Write the message
**Title** (one line):
- Imperative mood ("Move…", "Add…", "Fix…"), at most 72 characters, no trailing period.
- Format: `[<type>: ][<TICKET> ]<what changed>`, or the repo's style when that's clearer.
- Say what changed and where, not how.

**Blank line, then the body** (wrap at 72 characters):
- One or two sentences on the purpose of the change.
- 3 to 8 bullets on the concrete changes, grouped by kind: moves or renames, new modules, behavior or UI changes, config, tests. Name key files or folders, not every file.
- If you can see them, mention breaking changes, follow-ups or intentional temporary code (for example "keeps the `src/` alias until cleanup").
- Optionally a closing line such as `Tests: 30 files / 384 passing`, but only if the user or this session actually ran them.

Keep it short: the body should be readable in about 15 seconds.

## 4. Output
1. One sentence saying what was analyzed: staged or working tree, file count, branch, and anything left out.
2. The message in a single fenced `text` block, ready to copy.
3. Optionally, one alternative title if there's a meaningfully different framing.
4. A one-line hint:
   ```bash
   git commit -F <file>   # or: git commit -e, then paste the message
   ```
5. Stop. Don't offer to commit unless the user asks.

## Example

`/dehv-commit type=refactor focus=tests` on a branch `feat/ABC-123/shared-order-types`:

```text
refactor: ABC-123 Move order types to shared/domain

Group the order API response types and their test builders under
shared/domain so every feature imports them from one barrel.

- Tests: checkout utils tests use OrderItemBuilder and
  withItems() instead of inline objects
- Move order-item, order-status, order-response and
  order-summary types from src/types (kebab-case names)
- Add the shared/domain barrel, imported as @/shared/domain
- Export OrderItem (previously a global type) and import it
  explicitly in checkout utils and OrderItemsTable
- Update 12 consumers to the new import paths
```