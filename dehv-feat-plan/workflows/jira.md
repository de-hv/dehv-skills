# Jira (`--jira`)

1. **Worker "jira draft"** (read-only): reads the request, the plan and the Jira issues
   involved, and returns exactly what would change: issues, fields, text.
2. Show the list and **ask for confirmation**.
3. **Worker "jira apply"**: makes exactly the approved changes with the Atlassian tools
   (approval quoted in the brief), records the Jira keys and links in `PLAN.md` and the step
   files, and returns them.
4. Summary, then clerk `apply`.
