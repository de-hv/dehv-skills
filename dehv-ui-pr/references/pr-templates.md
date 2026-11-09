# PR templates

Teams put conventions in their PR template: checklists, sections reviewers look for, and
links. Keeping it intact avoids a description that looks foreign, and avoids failing checks
that parse the template.

## 1. Find it

Search the **base branch's** version first (`git show <base>:<path>`), then the working tree.
Matching is case-insensitive. Take the first match.

| Host | Locations, in order |
| --- | --- |
| GitHub | `.github/pull_request_template.md`, `pull_request_template.md`, `docs/pull_request_template.md`, then `.github/PULL_REQUEST_TEMPLATE/*.md` (if there are several, pick the one whose name matches the change type, `feature`/`bugfix`/`ui`; otherwise ask through the PR lead) |
| Azure DevOps | branch-specific first: `.azuredevops/pull_request_template/branches/<base>.md` (also under `.vsts/`, `docs/` and the root), then the default: `.azuredevops/pull_request_template.md`, `.vsts/pull_request_template.md`, `docs/pull_request_template.md`, `pull_request_template.md` |
| GitLab | `.gitlab/merge_request_templates/Default.md`, then the only `.md` in that folder; otherwise ask |
| Bitbucket | none in the repo (templates live in the repo's web settings): use the default body |

## 2. Fill it

1. **Keep every line of the template:** headings, HTML comments, checklists and links, in
   their order.
2. **Pick the target section:** the first heading whose text matches (case-insensitive)
   `description`, `details`, `summary`, `what`, `changes`, `overview` or `context`. If none
   matches, use the first heading. If there are no headings at all, put the content at the
   top, above the template.
3. **Under the target section,** put Summary, Changes, Visual changes, How to test, and
   Notes/risks as sub-headings one level deeper (or bold labels if the template uses bold
   labels). Keep any placeholder comment (`<!-- describe your change -->`) above the content.
   Don't delete it.
4. **Other sections:** fill them only with facts you have. Typical cases:
   - "Screenshots"/"UI changes" → move the Visual changes there instead of the target section.
   - "Testing"/"How to test" → move How to test there.
   - "Ticket"/"Related work items"/"Jira" → the id (or link).
   - Checklists: tick (`[x]`) only items that are verifiably true in this session ("unit tests
     added" when the diff adds tests, "tests pass" only when they ran). Leave the rest
     unticked for the author.
5. **Never** remove a section because it's empty, and never reword the template's own text.
