# Default PR body (no repo template)

Use this structure when the repo has no PR template. Drop a section only when it truly has
nothing, for example no Visual changes for a logic-only fix.

```markdown
## Summary
<2–3 sentences: what changed for the user or the codebase, and why. Start from the user's description.>

**Ticket:** <ID or link>

## Changes
- **UI:** <components and what they now show or do>
- **Logic:** <behavior changes>
- **Structure:** <moves, new modules, config>
- **Tests:** <what is covered>

## Visual changes
![Before / after: <view>](attach:compare-<view>.png)
<one line on what is highlighted>

![Architecture before / after: <slug>](attach:arch-<slug>.png)
<one line on what moved>

## How to test
1. <run or open: route or URL>
2. <action>
3. <expected result>

## Notes
- <breaking changes, flags, follow-ups, temporary code; only what the diff shows>
```

Example of a filled Summary and Changes for a small UI change:

```markdown
## Summary
Adds a rating badge to each row of the results grid so users can compare providers
without opening the detail panel.

**Ticket:** ABC-123

## Changes
- **UI:** new `RatingBadge` component in the grid's "Provider" column
- **Logic:** `formatRating` rounds to one decimal and hides empty ratings
- **Tests:** `RatingBadge` and `formatRating` unit tests
```
