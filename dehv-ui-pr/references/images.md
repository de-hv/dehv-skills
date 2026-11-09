# Images

Contents:
1. When images earn their place
2. Run folder and naming
3. Highlighting changed elements
4. Composing a before/after image
5. Rendering an architecture diagram

All helpers live in `SKILL_DIR/scripts/` and need only Node and `playwright-cli`.

## 1. When images earn their place

A reviewer should understand a visual change without running the branch. Images help when:

- **UI:** layout, styling, new or removed elements, changed text, or new states (empty, error,
  loading). Show the view in the state where the change is visible.
- **Architecture:** modules moved, a new boundary (package, remote, service), or a changed data
  flow. Show a before/after graph.

They don't help for logic that has no visible effect, tests, or docs. In those cases the PR
lead asks the user instead of guessing. Keep it to 1–4 images: one per story, not one per file.

## 2. Run folder and naming

Everything goes under `<run folder>/images/`:

| File | What |
| --- | --- |
| `before-<view>.png`, `after-<view>.png` | Raw shots of each side, with the highlight on. |
| `compare-<view>.png` | The composed side-by-side, which is what goes into the PR. |
| `arch-<slug>.before.mmd`, `arch-<slug>.after.mmd`, `arch-<slug>.png` | The diagram sources and the rendered before/after. |

`<view>` is a short kebab-case slug, for example `results-grid` or `settings-modal`. The temp
folder isn't committed to the repo; the images reach the PR only as attachments.

## 3. Highlighting changed elements

Use `scripts/highlight.js`. It outlines each target without moving the layout, adds a numbered
label, and returns JSON listing what it found plus the **region** (page coordinates) holding
every outline and label, which is used for cropping later.

**One target per kind of change, not per element.** A selector outlines every visible match.
The full label appears once, with a count (`1  New rating badge (×3)`), and the other matches
get only the number chip. Targets are a JSON list of `{ "selector": "<css>" }` or
`{ "text": "<visible text>" }`, each with a `"label"`.

```bash
TARGETS='[{"selector":".rating-badge","label":"New rating badge"},{"text":"Sort by rating","label":"New sort option"}]'
JS=$(node -e 'const fs=require("fs");process.stdout.write(fs.readFileSync(process.argv[1],"utf8").replace("__TARGETS__",process.argv[2]))' "$SKILL_DIR/scripts/highlight.js" "$TARGETS")
playwright-cli -s=pr-<side> eval "$JS" --raw > images/<side>-<view>.json      # found, missing, region, page
playwright-cli -s=pr-<side> screenshot --full-page --filename=images/<side>-<view>.png
playwright-cli -s=pr-<side> eval "() => document.querySelectorAll('[data-dehv-hl]').forEach(n => n.remove())"
```

- Always use `--full-page`: the region is in page coordinates, and those match pixels only on
  a full-page shot.
- Use **the same targets and labels on both sides.** A target missing on one side (a new or
  removed element) just isn't drawn there, and the result lists it as `missing`. Report that
  in the handoff.
- Prefer stable selectors (`data-testid`, ids, component class names) over text when both
  exist.

## 4. Composing a before/after image

`scripts/compare.html` puts both shots side by side with "Before" and "After" labels, a title
and a caption. `playwright-cli` blocks `file://` URLs, so `scripts/serve.mjs` serves the page
and the images on `127.0.0.1` with the parameters encoded in the URL, so paths and text need
no escaping. It prints the URL on its first line and stops itself after `--ttl` seconds:

```bash
cd "<run folder>"
node "$SKILL_DIR/scripts/serve.mjs" compare.html --ttl=300 \
  before="<run folder>/images/before-<view>.png" \
  after="<run folder>/images/after-<view>.png" \
  title="<view title>" beforeLabel="Before · <old host or branch>" afterLabel="After · <new host>" \
  caption="<one line per number: what is highlighted>" \
  crop="<x,y,width,height>" > serve.url &
SERVER=$!; sleep 1
playwright-cli -s=pr-compose open "$(head -1 serve.url)"
playwright-cli -s=pr-compose resize 2400 1600
playwright-cli -s=pr-compose eval "() => window.frameReady"      # repeat until true
playwright-cli -s=pr-compose screenshot "#frame" --filename=images/compare-<view>.png
playwright-cli -s=pr-compose close; kill $SERVER
```

- **Crop to the change:** `crop` is the union of the `region` values from both sides'
  `<side>-<view>.json` (where a side has no region, use the other side's). The page adds
  `pad` pixels of context around it (default 96; use more when the change needs its
  surroundings to make sense). The same rectangle is cut from both shots, so they stay
  comparable. Leave `crop` out only when the whole page is the change, for example a new page.
- Leave `before=` out when the view didn't exist before. The page then shows a "Not present
  before" panel. Leave `after=` out when the view was removed.
- A headless session is fine here (it's a local page). Run it from the run folder, as the
  shooters do.
- If the shots themselves come from local static files, serve them over HTTP too
  (`python3 -m http.server` or `npx serve`): `playwright-cli` won't open `file://`.

## 5. Rendering an architecture diagram

`scripts/diagram.html` renders two Mermaid sources side by side (Before, After) with a legend
for added, removed and changed. Mermaid loads from a CDN, so this needs network access.

```bash
cd "<run folder>"
node "$SKILL_DIR/scripts/serve.mjs" diagram.html --ttl=300 \
  before@="images/arch-<slug>.before.mmd" \
  after@="images/arch-<slug>.after.mmd" \
  title="<what the diagram compares>" > serve.url &
SERVER=$!; sleep 1
playwright-cli -s=pr-diagram open "$(head -1 serve.url)"
playwright-cli -s=pr-diagram resize 2400 1600
playwright-cli -s=pr-diagram eval "() => window.frameReady || window.frameError"   # repeat until set
playwright-cli -s=pr-diagram screenshot "#frame" --filename=images/arch-<slug>.png
playwright-cli -s=pr-diagram close; kill $SERVER
```

`key@=path` makes `serve.mjs` read the file's text, so the diagrammer splits its `.mmd` into
`.before.mmd` and `.after.mmd` first. If `window.frameError` is set (for example the CDN is
unreachable or the Mermaid syntax is invalid), report the error. Fix the syntax and retry
once; otherwise fall back to the Mermaid code block.
