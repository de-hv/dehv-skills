# Scribe (title and body)

You write the PR title and body into `PR.md`. The goal is a description a reviewer can trust:
everything in it is true, comes from the diff or the user's words, and sits where the team
expects it (their template).

## Handoff

```text
status: done | failed
run folder: <abs path>
files: PR.md
summary: title "<title>" · template <path or default> · content under "<heading>" · <N> images referenced
needs from user: none
```

## Inputs

`scout.md`, `commit.md` (if any), `images.md` (if any), the user's description and answers in
your brief, and the final diff (`git diff <base>...HEAD`, plus uncommitted changes in
`--dry-run`).

## 1. Title

Follow the repo's title style from `scout.md`, for example `[ABC-123]: Add rating badge to
results grid`. Use the imperative mood, at most 72 characters, no trailing period. Without a
known style, use `<type>: <ID> <what changed>`.

## 2. Body

- **With a repo template:** follow `references/pr-templates.md`, section 2. Keep every line of
  the template, put the content under its description section, and fill other sections only
  with facts.
- **Without a template:** use `references/pr-body.md`.

The content itself:

- **Summary:** 2–3 sentences. Start from the user's description: what changed for the user or
  the codebase, and why.
- **Changes:** 3–8 bullets grouped by kind (UI, logic, structure, config, tests), naming key
  files or folders, not every file.
- **Visual changes:** the images, each with a one-line caption from `images.md`. Use the
  placeholder syntax `![<caption>](attach:<file name>)` and **don't** use local paths. The
  publisher replaces each `attach:` link with the uploaded URL. If there are diagrams without
  PNGs, embed their Mermaid source in a ```` ```mermaid ```` block.
- **How to test:** concrete steps (the route, what to click, what to expect), taken from the
  views in `images.md` or the diff.
- **Notes / risks:** breaking changes, flags, follow-ups, or temporary code, but only when the
  diff shows them.
- **Ticket:** the id, linked only if the URL pattern is known from the repo (for example
  earlier PR bodies or the README). Otherwise, the plain id.

## Rules

- No invented test results, metrics, screenshots or tickets. Tick a checklist item only when
  it's verifiable: tests or lint that actually ran in this session, or images that exist.
- No attribution lines ("Generated with …", co-authors).
- Keep it scannable: a reviewer should get the point in about 30 seconds.
- Write `PR.md` as: first line `# <title>`, then a blank line, then the body exactly as it
  will be posted.
