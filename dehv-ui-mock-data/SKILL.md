---
name: dehv-ui-mock-data
description: >-
  Create and organize unit-test mock data using Builder or ObjectMother classes
  in __mocks__ folders. Use when writing tests, adding fixtures, or creating
  mock data for services, API responses, domain models, or component props in
  any JavaScript or TypeScript project.
---

# Mocked Data

Guidelines for creating reusable test fixtures. Prefer **classes** over plain objects, arrays, or inline literals.

## When to read this skill

- Adding or updating mock/fixture data for unit tests
- Choosing between Builder and ObjectMother
- Deciding where mock files live in the project

## Mock file location

Place mocks in a co-located `__mocks__` folder next to the module they support. Create the folder if it does not exist, or add to an existing one.

| Mock kind | Typical location |
|-----------|------------------|
| Domain / DTO / API payloads | `{module}/__mocks__/{entity}.mock.{js,ts}` |
| Service / repository doubles | `{module}/__mocks__/{name}.mock.{js,ts}` |
| Component / view props | `{component}/__mocks__/{name}.mock.{js,ts}` |
| Shared fixtures used across modules | `__mocks__/{entity}.mock.{js,ts}` at the nearest common ancestor |

**Naming:** `{entity}.mock.{js,ts}` — use `.ts` only in TypeScript projects, `.js` in JavaScript-only projects.

**Do not** put reusable fixtures inline in test files — extract them to `__mocks__`.

Follow the project's existing import style (relative paths, path aliases, etc.) when importing from `__mocks__`.

## Builder vs ObjectMother

### Builder — dynamic / overridable data

Use when tests need to tweak specific fields while keeping sensible defaults.

**TypeScript:**

```
export class DataBuilder {
  private data: DataType = { ... }

  withId(value: string) {
    this.data.id = value
    return this
  }

  build() {
    return this.data
  }
}
```

**JavaScript:** same structure, without type annotations.

**When to use:** per-test variations, partial overrides, composing nested objects.

**Naming:** `{Entity}Builder` (e.g. `UserBuilder`, `OrderBuilder`).

**Optional:** named setters for frequently overridden fields (e.g. `withStatus(value)`).

### ObjectMother — fixed / shared data

Use when the same payload is reused unchanged across tests.

```
export class DataMother {
  static data: DataType = { ... }
}
```

In JavaScript, omit the type annotation on `static data`.

**When to use:** static lists, canonical API responses, shared constants.

**Naming:** `{Entity}Mother` (e.g. `UsersMother`, `ErrorResponsesMother`).

### Dependency / interface doubles

For mocks that stand in for a service, repository, or module dependency, use `{Name}Mock` with a fluent `with()` that assigns overrides:

**TypeScript:**

```
export class UserServiceMock implements IUserService {
  findById = vi.fn() // or jest.fn(), sinon.stub(), etc.

  with(attributes: Partial<IUserService>) {
    Object.assign(this, attributes)
    return this
  }
}
```

**JavaScript:** same pattern without `implements` or type annotations.

Use `{Entity}Mock` when the double represents a domain instance with behavior (methods, getters).

## TypeScript

- **TypeScript projects:** import types from the source module; type `with()` as `Partial<T>`, private fields as `T`, and use `implements` on dependency doubles when an interface exists.
- **JavaScript projects:** omit type annotations and `implements`; keep the same class structure and method names.

Detect TypeScript by the presence of `.ts`/`.tsx` source or test files and a `tsconfig`. Do not add types in JS-only projects.

## Test describe patterns (language-agnostic)

These conventions apply with or without TypeScript and with any test runner (Jest, Vitest, Mocha, etc.):

### File layout

- Tests live in `__tests__/` next to source, or as `*.{test,spec}.{js,ts,jsx,tsx}`.
- One primary unit under test per file (function, class, module, hook, component).

### Top-level `describe`

Name the **unit under test**:

```
describe('formatCurrency', () => { ... })
describe('UserRepository', () => { ... })
describe('useAuth', () => { ... })
describe('LoginForm', () => { ... })
```

### Nested `describe`

Group by **method, feature, or scenario**:

```
describe('create', () => { ... })
describe('when user is unauthenticated', () => { ... })
describe('validateEmail', () => { ... })
```

### `it` / `test` titles

Use short, behavior-focused phrases. Pick one style per file and stay consistent:

| Style | Example |
|-------|---------|
| **should** (BDD) | `it('should return empty list when no items match', ...)` |
| **behavior** (no should) | `it('returns formatted price with currency symbol', ...)` |
| **action / state** | `it('throws when id is missing', ...)` |
| **mapping / rules** | `it('maps API response to domain model', ...)` |
| **edge case** | `it('treats null as empty string', ...)` |

Prefer titles that state **expected outcome** or **condition + outcome**, not implementation details.

### Setup hooks

Use the hooks provided by the test runner (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`). Reset mutable mock state in `beforeEach` so tests stay isolated.

## Usage in tests

```
import { UserBuilder } from '../__mocks__/user.mock'
import { UsersMother } from '../__mocks__/users.mock'

const user = new UserBuilder()
  .withId(1)
  .withActive(false)
  .build()
const users = UsersMother.list
```

Compose builders when one fixture depends on another:

```
private data = {
  ...new AddressBuilder().build(),
  userId: 1
}
```

## Checklist

- [ ] Mock lives in `__mocks__/{entity}.mock.{js,ts}`, not inline in the test
- [ ] Uses a class (Builder, ObjectMother, or Mock) — not a bare object/array export
- [ ] Builder chosen for overrides; ObjectMother for fixed shared data
- [ ] Types added only in TypeScript projects
- [ ] File extension matches the project language (`.js` vs `.ts`)
- [ ] Defaults are realistic enough for the unit under test
- [ ] Test `describe`/`it` titles follow behavior-focused naming

## Anti-patterns

- Plain exported objects: `export const mockUser = { ... }`
- Large inline fixtures inside `it()` / `test()` blocks
- Copy-pasting the same object across multiple test files
- Placing test mocks alongside production source outside of `__mocks__`
