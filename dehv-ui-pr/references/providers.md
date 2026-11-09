# Providers: detect, create, attach

Contents:
1. Detect the host and pick a tool
2. Create (and find or update) the PR
3. Attach images
4. Web fallback

Commands below are the common forms. If a CLI is older or newer, check its `--help` and adapt.
Never print tokens. Redact them in `publish.md`.

## 1. Detect the host and pick a tool

Read `git remote get-url origin` (or the remote the branch tracks).

| Host | URL forms | Parse |
| --- | --- | --- |
| GitHub | `https://github.com/<owner>/<repo>(.git)`, `git@github.com:<owner>/<repo>.git`, GitHub Enterprise hosts that `gh auth status` lists | owner, repo |
| Azure DevOps | `https://dev.azure.com/<org>/<project>/_git/<repo>`, `https://<org>@dev.azure.com/<org>/<project>/_git/<repo>`, `https://<org>.visualstudio.com/(DefaultCollection/)<project>/_git/<repo>`, `git@ssh.dev.azure.com:v3/<org>/<project>/<repo>` | org URL `https://dev.azure.com/<org>`, project, repo (URL-decode `%20`) |
| GitLab | `gitlab.com` or a host containing `gitlab` | group/subgroups, project |
| Bitbucket | `bitbucket.org` | workspace, repo |

Then pick the first tool that works. **MCP first:** search the deferred tools (ToolSearch)
for "pull request", plus the host name. Use an MCP tool only if it can create a PR for this
host and you can see its parameters. Then try the CLIs:

| Host | CLI check | Install | Login |
| --- | --- | --- | --- |
| GitHub | `gh --version && gh auth status` | `brew install gh` · `winget install GitHub.cli` · `sudo apt install gh` | `gh auth login` |
| Azure DevOps | `az --version`, `az extension show -n azure-devops`, `az account show` | `brew install azure-cli` · `winget install Microsoft.AzureCLI`, then `az extension add -n azure-devops` | `az login` (or a PAT in `AZURE_DEVOPS_EXT_PAT`) |
| GitLab | `glab --version && glab auth status` | `brew install glab` · `winget install glab` | `glab auth login` |
| Bitbucket | no standard CLI | — | web fallback |

Record what you checked and the result. If nothing works, use the web fallback (section 4)
and give the user the install and login commands for their OS.

## 2. Create (and find or update) the PR

Write the body to `<run folder>/PR.body.md` first, and pass it as a file.

**GitHub (`gh`)**

```bash
gh pr list --head <branch> --base <base> --state open --json number,url      # existing?
gh pr create --base <base> --head <branch> --title "<title>" --body-file PR.body.md [--draft]
gh pr edit <number> --body-file PR.final.md
gh pr view <number> --json body,url
```

**Azure DevOps (`az repos`)**: PR descriptions are limited to **4000 characters**. If the
body is longer, shorten Changes first and keep the images.

```bash
az repos pr list --org <org-url> --project "<project>" --repository <repo> --source-branch <branch> --target-branch <base> --status active -o json
az repos pr create --org <org-url> --project "<project>" --repository <repo> \
  --source-branch <branch> --target-branch <base> --title "<title>" \
  --description @PR.body.md [--draft true] -o json        # @file loads the value from a file
az repos pr update --org <org-url> --id <id> --description @PR.final.md -o json
az repos pr show --org <org-url> --id <id> --query description -o tsv
```

The web URL is `<org-url>/<project>/_git/<repo>/pullrequest/<id>`.

**GitLab (`glab`)**

```bash
glab mr list --source-branch <branch> --target-branch <base>
glab mr create --source-branch <branch> --target-branch <base> --title "<title>" --description "$(cat PR.body.md)" [--draft] --yes
glab mr update <iid> --description "$(cat PR.final.md)"
```

**MCP:** map the same fields (source branch, target branch, title, description, draft) onto
the tool's parameters. Then read the PR back to get its id and URL.

## 3. Attach images

**Azure DevOps.** Run `node "$SKILL_DIR/scripts/azure-attach.mjs" <org-url> "<project>" <repo> <pr-id> <png>...`.
It gets a token with
`az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798`, or uses
`AZURE_DEVOPS_EXT_PAT`. It POSTs each file to
`<org-url>/<project>/_apis/git/repositories/<repo>/pullRequests/<id>/attachments/<file>?api-version=7.1-preview.1`
and prints `<file>\t<url>`. Embed each one as `![caption](<url>)`.

**GitLab.** Run `glab api --method POST "projects/<url-encoded path>/uploads" -F "file=@<png>"`.
The JSON has a `markdown` field you can use as it is.

**GitHub.** There is no API to upload images into a PR description. With the user's quoted
OK, use the browser:

1. Open the PR page in the headed `playwright-cli` session with the user's profile
   (`--profile="$HOME/.cache/dehv-ui-pr/profiles/github.com"`). If it shows a sign-in page,
   return `needs-user`.
2. In the **new comment** box at the bottom (never submit it), `click` the "Paste, drop, or
   click to add files" control (find it with `snapshot` or `find "add files"`). That opens
   the file chooser. Then run `playwright-cli -s=<session> upload <abs png> [<abs png>...]`.
   If the control opens nothing, use `drop <ref>` with the files instead (see `drop --help`).
3. Wait until the textarea contains one `![...](https://github.com/user-attachments/assets/...)`
   line per file, read its value with `eval`, then **clear the textarea** so nothing gets
   posted.
4. Use those URLs in `PR.final.md` and update the body with `gh pr edit` or the MCP.

If any step fails, fall back to the manual upload below.

**Bitbucket and fallbacks.** Leave the `attach:` placeholders in place and report each file's
full path. The user drags the files into the description in the web editor, and each one
replaces its placeholder line.

## 4. Web fallback

Push with git, then give the user a prefilled "create" link and the path of `PR.md`:

| Host | Link |
| --- | --- |
| GitHub | `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1` |
| Azure DevOps | `<org-url>/<project>/_git/<repo>/pullrequestcreate?sourceRef=<branch>&targetRef=<base>` |
| GitLab | `https://<host>/<path>/-/merge_requests/new?merge_request[source_branch]=<branch>&merge_request[target_branch]=<base>` |
| Bitbucket | `https://bitbucket.org/<workspace>/<repo>/pull-requests/new?source=<branch>&dest=<base>` |
