---
name: dehv-ui-unit-tests
description: >-
  Write unit tests for functions, classes, hooks, and components in any
  JavaScript or TypeScript project. Covers scenario coverage, describe structure,
  repo convention discovery, and mock data. Use when adding or updating unit
  tests, improving coverage, or testing a utility module.
---

# Unit Tests

Guidelines for writing thorough, consistent unit tests in any repo. Always adapt to the project's existing test runner, libraries, and file layout before writing new tests.

## When to read this skill

- Adding or updating unit tests for a function, class, hook, or component
- Improving coverage for a utility module
- Deciding which scenarios to cover and how to structure `describe` / `it` blocks

**Mock data:** read [dehv-ui-mock-data](../dehv-ui-mock-data/SKILL.md) before creating or extending fixtures.

## Workflow

1. **Discover** — inspect the unit under test and existing tests in the repo.
2. **Plan scenarios** — list every behavior branch, edge case, and error path worth asserting.
3. **Mocks** — reuse existing `__mocks__` fixtures; create new ones only when needed (see the `dehv-ui-mock-data` skill).
4. **Write** — one top-level `describe` per testable utility; behavior-focused `it` titles.
5. **Run** — execute the project's test command for the file or suite; fix failures before finishing.

## Step 1 — Discover repo conventions

Before writing tests, inspect the target repo:

| What to find | Where to look |
|--------------|---------------|
| Test runner | `package.json` scripts (`test`, `test:unit`, `vitest`, `jest`) |
| Config | `jest.config.*`, `vitest.config.*`, `setupTests.*` |
| Test libraries | `@testing-library/react`, `renderHook`, `sinon`, `msw`, etc. |
| File layout | `__tests__/` co-located vs `*.test.ts` / `*.spec.ts` beside source |
| Import style | path aliases (`@/`), relative imports |
| Existing mocks | `**/__mocks__/**/*.mock.{js,ts}` |
| Nearby tests | tests in the same module or sibling folders |

**Match what already exists.** Do not introduce a new runner, assertion library, or file naming scheme unless the user asks for it.

## Step 2 — Test file placement

| Pattern | Example |
|---------|---------|
| Co-located `__tests__` | `src/utils/__tests__/format.test.ts` |
| Suffix beside source | `src/utils/format.test.ts` |
| Component tests | `src/components/__tests__/Spinner.test.tsx` |

**One primary unit per file** — a single module, class, hook, or component. When a source file exports multiple independent utilities, they may share one test file but each utility gets its own `describe` block (see below).

Use `.ts` / `.tsx` in TypeScript projects; `.js` / `.jsx` in JavaScript-only projects.

## Step 3 — `describe` structure

### Multiple utilities in one module

When the source file exports **more than one** testable function, method, or utility, give **each** its own top-level `describe` — named after that utility:

```
describe('formatToMoney', () => { ... })
describe('unformatMoney', () => { ... })
describe('isValidEmail', () => { ... })
```

Do **not** lump unrelated utilities under a single generic `describe('helpers')` unless the repo already does so consistently for that file.

### Single class with multiple methods

Use one top-level `describe` for the class, nested `describe` per method:

```
describe('UserRepository', () => {
  describe('findById', () => { ... })
  describe('create', () => { ... })
})
```

### Single component or hook

One top-level `describe` named after the component or hook:

```
describe('Spinner', () => { ... })
describe('useClickOutside', () => { ... })
```

### Nested grouping

Inside a utility `describe`, group by scenario when it improves readability:

```
describe('isValidEmail', () => {
  describe('when validationType is full', () => { ... })
  describe('when email is empty', () => { ... })
})
```

### `it` / `test` titles

Use short, behavior-focused phrases. Pick one style per file and stay consistent:

| Style | Example |
|-------|---------|
| **should** (BDD) | `it('should return empty list when no items match', ...)` |
| **behavior** | `it('returns formatted price with currency symbol', ...)` |
| **action / state** | `it('throws when id is missing', ...)` |
| **edge case** | `it('treats null as empty string', ...)` |

State **expected outcome** or **condition + outcome**, not implementation details.

## Step 4 — Scenario coverage

Cover **as many scenarios as the utility requires** — not a fixed count. Read the implementation and enumerate branches, parameters, and side effects. Add a test for each distinct behavior.

### Pure functions / utilities

| Scenario type | Examples |
|---------------|----------|
| Happy path | Valid input → expected output |
| Empty / null / undefined | `''`, `null`, `undefined`, `[]`, `{}` |
| Boundary values | `0`, `1`, max length, min length |
| Invalid input | wrong type, malformed data, out-of-range |
| Optional parameters | omitted arg vs explicit default |
| Parameter variants | each enum / flag / mode combination |
| Idempotency | calling twice yields same result |
| Error paths | throws, returns error object, returns fallback |

### Adapters / mappers

| Scenario type | Examples |
|---------------|----------|
| Full mapping | all fields transformed correctly |
| Partial / sparse input | missing optional fields |
| Empty collections | `[]` → `[]` |
| Conditional fields | flags that include or exclude mapped keys |
| Nested objects | deep structure preserved or flattened |

### Classes

| Scenario type | Examples |
|---------------|----------|
| Per public method | own `describe` block |
| State transitions | before / after mutations |
| Invalid operations | calling method in wrong state |
| Dependency interaction | mock collaborators called with correct args |

### React components

| Scenario type | Examples |
|---------------|----------|
| Renders | key elements, text, roles, test ids |
| Props | default props, required props, conditional rendering |
| User interaction | click, type, select — assert callback or UI change |
| Loading / error / empty states | each visual state |
| Accessibility | roles, labels, aria attributes when relevant |

Use the testing library already in the repo (`@testing-library/react`, Enzyme, etc.). Prefer queries by role or test id over implementation details.

### Hooks

| Scenario type | Examples |
|---------------|----------|
| Initial return value | first render state |
| State updates | `act` + user/event triggers |
| Side effects | subscriptions, listeners, cleanup on unmount |
| Dependency changes | different args → different behavior |
| Error handling | invalid usage or failed async |

Use `renderHook` (or the repo's equivalent) and reset mocks in `beforeEach`.

### Async / API layers

| Scenario type | Examples |
|---------------|----------|
| Success response | data returned / stored |
| HTTP errors | 4xx, 5xx, network failure |
| Empty response | no data |
| Request shape | correct URL, method, body |

Mock at the boundary the repo already uses (jest mocks, MSW, nock, etc.).

## Step 5 — Mock data

### Reuse before creating

1. Search `__mocks__` near the module under test and in shared type folders.
2. Read tests in the same feature area — import the same builders/mothers.
3. Extend existing builders with `.with({ ... })` rather than duplicating objects.

### Create when missing

Follow the [dehv-ui-mock-data](../dehv-ui-mock-data/SKILL.md) skill:

- **Builder** — per-test field overrides
- **ObjectMother** — fixed shared payloads
- **Mock** — service / dependency doubles with `jest.fn()` / `vi.fn()`

Never place large inline fixtures inside `it()` blocks. Extract to `__mocks__/{entity}.mock.{js,ts}`.

```
import { UserBuilder } from '../__mocks__/user.mock'

const user = new UserBuilder().with({ active: false }).build()
```

## Step 6 — Setup and isolation

Use the test runner's hooks (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`):

- Reset mocks and spies in `beforeEach`
- Restore timers and modules in `afterEach` / `afterAll`
- Use `jest.useFakeTimers()` / `vi.useFakeTimers()` only when the utility depends on time

Do not share mutable state across tests.

## Step 7 — Run tests

Detect the command from `package.json`:

```
# Common patterns — use what the repo defines
npm test -- path/to/file.test.ts
yarn test path/to/file.test.ts
npx vitest run path/to/file.test.ts
npx jest path/to/file.test.ts
```

Run the specific file or suite after writing tests. Fix failures before considering the task done.

## Quick reference — file skeleton

### Utility module (multiple exports)

```
import { fnA, fnB } from '../module'
import { EntityBuilder } from '../__mocks__/entity.mock'

describe('fnA', () => {
  it('returns expected value for valid input', () => {
    expect(fnA('input')).toBe('output')
  })

  it('returns empty string when input is empty', () => {
    expect(fnA('')).toBe('')
  })
})

describe('fnB', () => {
  it('maps entity fields correctly', () => {
    const entity = new EntityBuilder().build()
    expect(fnB(entity)).toStrictEqual({ ... })
  })
})
```

### Component

```
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Checklist

- [ ] Repo test runner, layout, and import style matched
- [ ] Existing `__mocks__` searched and reused where possible
- [ ] New mocks follow the `dehv-ui-mock-data` skill (Builder / ObjectMother / Mock classes)
- [ ] One top-level `describe` per utility (or per class method when testing a class)
- [ ] Scenarios cover happy path, edge cases, and error/empty paths as applicable
- [ ] `it` titles are behavior-focused and consistent within the file
- [ ] Mocks reset in `beforeEach`; no shared mutable state
- [ ] Tests run and pass via the project's test command

## Anti-patterns

- One giant `describe` for unrelated functions in the same file
- Testing only the happy path when branches or parameters exist
- Large inline fixture objects inside test bodies
- Copy-pasting mock data instead of reusing `__mocks__`
- Asserting implementation details (internal state, private methods) over observable behavior
- Introducing a new test library or file convention the repo does not use
- Skipping running tests after adding them
