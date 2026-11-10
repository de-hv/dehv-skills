# dehv-skills

Personal [Agent Skills](https://agentskills.io) for Claude Code and other coding agents.

| Skill | What it does |
| --- | --- |
| [`dehv-commit`](dehv-commit/SKILL.md) | Suggests a commit message from the current changes, without committing |
| [`dehv-feat-plan`](dehv-feat-plan/SKILL.md) | Creates and runs a step-by-step feature plan stored as Markdown |
| [`dehv-ui-pr`](dehv-ui-pr/SKILL.md) | Opens a documented UI pull request with before/after screenshots |
| [`dehv-ui-mock-data`](dehv-ui-mock-data/SKILL.md) | Creates reusable fixtures, builders and ObjectMothers |
| [`dehv-ui-unit-tests`](dehv-ui-unit-tests/SKILL.md) | Writes unit tests following the repo's conventions |

## Install

Clone the repo and link the skills into your agent's skills folder:

```bash
git clone <repo-url> ~/Documents/dev/dehv-skills
cd ~/Documents/dev/dehv-skills
./install.sh
```

The script asks where to link them and creates one symlink per skill, so edits in the repo
take effect right away (restart open agent sessions). It never touches other skills in the
target folder.

| Target | Folder |
| --- | --- |
| `claude` | `~/.claude/skills` |
| `agents` | `~/.agents/skills` (Codex, Gemini CLI, OpenCode) |
| `cursor` | `~/.cursor/skills` |
| `copilot` | `~/.copilot/skills` |
| a path | any folder, like `~/work/skills` |

Without prompts:

```bash
./install.sh --target claude,agents --yes
./install.sh --target claude --dry-run     # show the plan only
./install.sh --status                      # which targets have the skills
./install.sh --uninstall --target claude   # remove only the links into this repo
```

A real file or folder with the same name as a skill is skipped; pass `--force` to move it to
`<name>.bak-<date>` and link the skill instead. Run `./install.sh --help` for every option.
