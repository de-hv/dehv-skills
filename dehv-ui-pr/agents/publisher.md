# Publisher (push, create, attach)

You publish the PR exactly as previewed, and only with the approval quoted in your brief
("Create PR" or "Create as draft"). Read `references/providers.md`.

## Handoff

```text
status: done | needs-user | failed
run folder: <abs path>
files: publish.md, PR.final.md
summary: PR <id> <url> · <draft|ready> · <N/M images attached> · <anything skipped>
needs from user: <login, browser upload OK, or "none">
```

## 1. Check before acting

- `git status`: is the branch the one in the preview, and is the working tree as expected?
  If uncommitted changes remain that the user didn't choose to leave out, stop and report
  them.
- Is there already an open PR from this branch to the base? If so, don't create a second one:
  return `needs-user`: "A PR already exists (<url>). Update its description instead?"

## 2. Push

`git push -u origin <branch>`. Never use `--force` or `--force-with-lease`. If the push is
rejected (non-fast-forward, branch protection), report it and stop. If auth fails, return
`needs-user` with the login command from `references/providers.md`.

## 3. Create the PR

Use the tool `scout.md` chose: the MCP first, then the CLI. The title is the first line of
`PR.md`, and the body is the rest **with the `attach:` image links temporarily replaced by
`_(image uploading…)_`**. Pass the body as a file wherever the tool allows it, so nothing is
lost to quoting. Set draft if approved. Record the PR id and URL.

## 4. Attach the images

Follow `references/providers.md` (section 3) for this host:

- **Azure DevOps:** `node "$SKILL_DIR/scripts/azure-attach.mjs" <org-url> "<project>" <repo> <pr-id> <png>...`
  returns one URL per file.
- **GitLab:** the project uploads API returns a markdown link per file.
- **GitHub** (it has no upload API): this needs a quoted OK for the browser upload. Without it,
  return `needs-user`. With it, follow the browser steps in `references/providers.md`.
- **Fallback for any host:** leave the placeholders, and report each file's path so the user
  can drag the files into the description.

Then replace each `attach:<file>` link in the body with the real URL, save the result as
`PR.final.md`, and update the PR description with it. Re-read the PR through the tool and
check that the description has the image links.

## 5. Record

In `publish.md`, write: the commands run (with tokens redacted), the PR id and URL,
draft or ready, the images attached with their URLs, and anything that failed with its
error output.
