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

## Workflow

1. **Discover** — inspect the unit under test and the repo's test conventions.
2. **Plan scenarios** — list the behaviors worth asserting, in priority order.
3. **Mock data** — reuse existing fixtures; create new ones only when needed.
4. **Write** — place the file, structure `describe` blocks, and keep tests isolated.
5. **Run** — run the tests and the typecheck, then handle any failures by the failure policy.

## Step 1 — Discover

Before writing tests, inspect the target repo:

| What to find | Where to look |
|--------------|---------------|
| Test runner | `package.json` scripts (`test`, `test:unit`, `vitest`, `jest`) |
| Config | `jest.config.*`, `vitest.config.*`, `setupTests.*` |
| Test libraries | `@testing-library/react`, `@testing-library/user-event`, `renderHook`, `sinon`, `msw`, etc. |
| File layout | `__tests__/` co-located vs `*.test.ts` / `*.spec.ts` beside source |
| Import style | path aliases (`@/`), relative imports |
| Existing fixtures | `**/__mocks__/**`, `**/*.mock.*`, `**/__fixtures__/**`, `**/fixtures/**`, factories |
| Typecheck | `package.json` scripts (`typecheck`, `type-check`, `tsc`), `tsconfig*.json` |
| Nearby tests | tests in the same module or sibling folders |

**Match what already exists.** Do not introduce a new runner, assertion library, or file naming scheme unless the user asks for it.

## Step 2 — Plan scenarios

Read the implementation and list its branches, parameters, and side effects. Then read [references/scenarios.md](references/scenarios.md) and use the section for the unit type under test: pure functions, adapters, classes, React components, hooks, or async / API layers.

Add a test for each distinct behavior, in this order:

1. Main behavior and each branch of the implementation
2. Error paths, and empty or boundary values that callers can actually pass
3. Variants of the same behavior, in one table-driven test

**Skip:**

- Inputs the types already rule out, such as `null` for a `string` parameter. Test them only where values cross an untyped boundary: API responses, parsed JSON, user input, or JavaScript callers.
- Properties the code does not promise, such as idempotency of a pure function.
- Behavior of the framework or of third-party libraries.

**Use `it.each` for variants** that differ only in data. Use a separate `it` when the setup or the assertion differs. In runners without it (Mocha), loop over a table instead.

```
it.each([
  ['USD', '$1.00'],
  ['EUR', '€1.00'],
])('formats %s with its symbol', (currency, expected) => {
  expect(formatMoney(1, currency)).toBe(expected)
})
```

## Step 3 — Mock data

### Reuse before creating

1. Search the fixture locations found in Step 1, near the module under test and in shared type folders.
2. Read tests in the same feature area — import the same builders, mothers, or factories.
3. Extend existing builders with `.with({ ... })` rather than duplicating objects.

### Create when missing

Follow the [dehv-ui-mock-data](../dehv-ui-mock-data/SKILL.md) skill. It follows the repo's fixture convention first; without one, it defaults to these classes:

- **Builder** — per-test field overrides through `with()`
- **ObjectMother** — fixed shared payloads through static getters
- **Mock** — service / dependency doubles with `jest.fn()` / `vi.fn()`

Never place large inline fixtures inside `it()` blocks. Extract them to the repo's fixture location, by default `__mocks__/{entity}.mock.{js,ts}`.

```
import { UserBuilder } from '../__mocks__/user.mock'

const user = new UserBuilder().with({ active: false }).build()
```

## Step 4 — Write

### File placement

| Pattern | Example |
|---------|---------|
| Co-located `__tests__` | `src/utils/__tests__/format.test.ts` |
| Suffix beside source | `src/utils/format.test.ts` |
| Component tests | `src/components/__tests__/Spinner.test.tsx` |

**One primary unit per file** — a single module, class, hook, or component. When a source file exports multiple independent utilities, they may share one test file but each utility gets its own `describe` block (see below).

Use `.ts` / `.tsx` in TypeScript projects; `.js` / `.jsx` in JavaScript-only projects.

### `describe` structure

**Multiple utilities in one module:** when the source file exports **more than one** testable function or utility, give **each** its own top-level `describe`, named after that utility:

```
describe('formatToMoney', () => { ... })
describe('unformatMoney', () => { ... })
describe('isValidEmail', () => { ... })
```

Do **not** lump unrelated utilities under a single generic `describe('helpers')` unless the repo already does so consistently for that file.

**Single class with multiple methods:** use one top-level `describe` for the class, nested `describe` per method:

```
describe('UserRepository', () => {
  describe('findById', () => { ... })
  describe('create', () => { ... })
})
```

**Single component or hook:** one top-level `describe` named after the component or hook:

```
describe('Spinner', () => { ... })
describe('useClickOutside', () => { ... })
```

**Nested grouping:** inside a utility `describe`, group by scenario when it improves readability:

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

### Component queries and interactions

Use the testing library already in the repo. With Testing Library:

- Query in this order: `getByRole`, `getByLabelText`, `getByText`, and `getByTestId` only as a last resort.
- Drive interactions with `@testing-library/user-event`. If the repo does not have it, use `fireEvent` rather than adding a dependency.

### Setup and isolation

Use the test runner's hooks (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`):

- Reset mocks and spies in `beforeEach`, or create a new double for each test
- Restore timers and modules in `afterEach` / `afterAll`
- Use `jest.useFakeTimers()` / `vi.useFakeTimers()` only when the utility depends on time

Do not share mutable state across tests.

### File skeletons

**Utility module (multiple exports):**

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

**Component:**

```
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Hello" />)
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
  })

  it('calls onSave when the save button is clicked', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn() // or jest.fn()
    render(<MyComponent title="Hello" onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
```

## Step 5 — Run

### Tests

Detect the command from `package.json`, and run the specific file or suite:

```
# Common patterns — use what the repo defines
npm test -- path/to/file.test.ts
yarn test path/to/file.test.ts
npx vitest run path/to/file.test.ts
npx jest path/to/file.test.ts
```

### Typecheck

In TypeScript projects, also run the typecheck, because test runners such as Vitest do not check types and a badly typed mock would pass unnoticed. Use the repo's script (`typecheck`, `type-check`). Without a script, run `npx tsc --noEmit` if a `tsconfig` covers the test files; otherwise, say that no typecheck ran.

Fix errors in the test and mock files you touched. Report errors in other files without fixing them.

### Failure policy

For each failing test, find out whether the test or the production code is wrong:

- **The test is wrong** (bad setup, wrong mock, misread expectation): fix the test.
- **The test reveals a real bug:** do not weaken the assertion, match the test to the buggy behavior, or skip the test. Do not change production code. Leave the test failing, and report the test name, the expected and actual results, and the likely cause in the source.
- **The intended behavior is unclear:** do not guess. Report what the code does and ask which behavior is right.

Change production code only if the user asks for it.

## Checklist

- [ ] Repo test runner, layout, and import style matched
- [ ] Existing fixtures searched and reused where possible
- [ ] New mocks follow the `dehv-ui-mock-data` skill (repo convention first, then Builder / ObjectMother / Mock classes)
- [ ] One top-level `describe` per utility, or one per class with a nested `describe` per method
- [ ] Scenarios cover main behavior, branches, and reachable edge and error paths; no inputs the types rule out
- [ ] Variants that differ only in data use `it.each`
- [ ] `it` titles are behavior-focused and consistent within the file
- [ ] Mocks reset in `beforeEach`; no shared mutable state
- [ ] Tests run via the project's test command, and each one passes or is reported as a real bug
- [ ] Typecheck run in TypeScript projects that have one

## Anti-patterns

- One giant `describe` for unrelated functions in the same file
- Testing only the happy path when branches or parameters exist
- Testing inputs the types already rule out, or copy-pasting tests that differ only in data
- Large inline fixture objects inside test bodies
- Copy-pasting mock data instead of reusing existing fixtures
- Asserting implementation details (internal state, private methods) over observable behavior
- Introducing a new test library or file convention the repo does not use
- Skipping running tests after adding them
- Weakening an assertion or skipping a test to get a passing run
