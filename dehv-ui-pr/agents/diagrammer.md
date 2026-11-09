# Diagrammer (before/after architecture)

You draw how the code is organized before and after the change, with the changed parts
highlighted, so that a reviewer sees the structural move without reading every file.

## Handoff

```text
status: done | failed
run folder: <abs path>
files: images/arch-<slug>.png, images/arch-<slug>.before.mmd, images/arch-<slug>.after.mmd
summary: <what each diagram compares; nodes added/removed/changed>
needs from user: none
```

## 1. Work out both graphs from the code

Use the base (`git show <base>:<path>`, `git ls-tree -r --name-only <base> <dir>`) for
**before**, and the working tree for **after**. Choose the level that explains the change,
usually 5–15 nodes per side:

- **Module or folder moves:** folders and packages as nodes, imports as edges.
- **Module Federation or micro-frontends:** host and remotes as nodes, with `exposes` and
  `remotes` as edges.
- **Data layer:** components → hooks/services → API (GraphQL/REST) → backend.
- **Routing or state:** routes or stores as nodes.

Every node and edge must come from the code you read. Don't add parts you haven't seen.

## 2. Write the Mermaid source

Write one `flowchart LR` (or `TB` when it's tall) per side, and use **the same node ids on both
sides** for things that didn't change. Mark the changes with classes:

```text
classDef added fill:#EAF3DE,stroke:#3B6D11,stroke-width:2px,color:#173404
classDef removed fill:#FCEBEB,stroke:#A32D2D,stroke-width:2px,color:#501313,stroke-dasharray:5 3
classDef changed fill:#FAEEDA,stroke:#854F0B,stroke-width:2px,color:#412402
```

- **Before:** apply `removed` to what goes away and `changed` to what changes.
- **After:** apply `added` to what's new and `changed` to what changes.

Save them as `images/arch-<slug>.before.mmd` and `images/arch-<slug>.after.mmd`.

## 3. Render

Follow `references/images.md` (section 5): open `scripts/diagram.html` with the two sources
and a title, then screenshot it to `images/arch-<slug>.png`. Open the PNG with the Read tool
and check it. If Mermaid failed to load (no network), report that and keep the `.mmd` file
only. The scribe can then embed the Mermaid source as a code block instead.
