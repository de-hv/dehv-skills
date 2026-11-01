# Scenarios by unit type

Read only the section for the unit under test. These are prompts, not a list to complete: apply the priorities in Step 2 of [SKILL.md](../SKILL.md) and skip rows that do not apply.

## Pure functions / utilities

| Scenario type | Examples |
|---------------|----------|
| Happy path | Valid input → expected output |
| Empty / null / undefined | `''`, `null`, `undefined`, `[]`, `{}`, when the signature allows them |
| Boundary values | `0`, `1`, max length, min length |
| Invalid input | malformed data, out-of-range; wrong type only at untyped boundaries |
| Optional parameters | omitted arg vs explicit default |
| Parameter variants | each enum / flag / mode value with `it.each`; combinations only when they interact |
| Idempotency | calling twice yields same result, only when the function holds state or promises this |
| Error paths | throws, returns error object, returns fallback |

## Adapters / mappers

| Scenario type | Examples |
|---------------|----------|
| Full mapping | all fields transformed correctly |
| Partial / sparse input | missing optional fields |
| Empty collections | `[]` → `[]` |
| Conditional fields | flags that include or exclude mapped keys |
| Nested objects | deep structure preserved or flattened |

## Classes

| Scenario type | Examples |
|---------------|----------|
| Per public method | nested `describe` block inside the class's `describe` |
| State transitions | before / after mutations |
| Invalid operations | calling method in wrong state |
| Dependency interaction | mock collaborators called with correct args |

## React components

| Scenario type | Examples |
|---------------|----------|
| Renders | key elements and text |
| Props | default props, required props, conditional rendering |
| User interaction | click, type, select — assert callback or UI change |
| Loading / error / empty states | each visual state |
| Accessibility | roles, labels, aria attributes when relevant |

Query and interaction rules are in Step 4 of [SKILL.md](../SKILL.md).

## Hooks

| Scenario type | Examples |
|---------------|----------|
| Initial return value | first render state |
| State updates | `act` + user/event triggers |
| Side effects | subscriptions, listeners, cleanup on unmount |
| Dependency changes | different args → different behavior |
| Error handling | invalid usage or failed async |

Use `renderHook` (or the repo's equivalent) and reset mocks in `beforeEach`.

## Async / API layers

| Scenario type | Examples |
|---------------|----------|
| Success response | data returned / stored |
| HTTP errors | 4xx, 5xx, network failure |
| Empty response | no data |
| Request shape | correct URL, method, body |

Mock at the boundary the repo already uses (jest mocks, MSW, nock, etc.).
